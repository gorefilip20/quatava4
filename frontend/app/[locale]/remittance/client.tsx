"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Send,
  DollarSign,
  TrendingDown,
  ArrowRight,
  Loader2,
  Globe,
  Users,
  BarChart3,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  ArrowLeftRight,
} from "lucide-react";
import {
  useRemittanceStore,
  type Remittance,
} from "@/store/remittance/remittance-store";
import { useUserStore } from "@/store/user";
import { UserDashboardShell } from "@/components/layout/user-dashboard-shell";

const COUNTRIES = [
  { value: "AR", label: "Argentina", currency: "ARS", flag: "\u{1F1E6}\u{1F1F7}" },
  { value: "BR", label: "Brazil", currency: "BRL", flag: "\u{1F1E7}\u{1F1F7}" },
  { value: "CO", label: "Colombia", currency: "COP", flag: "\u{1F1E8}\u{1F1F4}" },
  { value: "CL", label: "Chile", currency: "CLP", flag: "\u{1F1E8}\u{1F1F1}" },
  { value: "PE", label: "Peru", currency: "PEN", flag: "\u{1F1F5}\u{1F1EA}" },
  { value: "MX", label: "Mexico", currency: "MXN", flag: "\u{1F1F2}\u{1F1FD}" },
  { value: "BO", label: "Bolivia", currency: "BOB", flag: "\u{1F1E7}\u{1F1F4}" },
  { value: "PY", label: "Paraguay", currency: "PYG", flag: "\u{1F1F5}\u{1F1FE}" },
  { value: "VE", label: "Venezuela", currency: "VES", flag: "\u{1F1FB}\u{1F1EA}" },
  { value: "UY", label: "Uruguay", currency: "UYU", flag: "\u{1F1FA}\u{1F1FE}" },
];

const CORRIDORS = [
  { from: "AR", to: "BR", label: "Argentina → Brazil" },
  { from: "BR", to: "AR", label: "Brazil → Argentina" },
  { from: "CO", to: "MX", label: "Colombia → Mexico" },
  { from: "PE", to: "CO", label: "Peru → Colombia" },
  { from: "CL", to: "AR", label: "Chile → Argentina" },
  { from: "MX", to: "CO", label: "Mexico → Colombia" },
  { from: "UY", to: "BR", label: "Uruguay → Brazil" },
  { from: "VE", to: "CO", label: "Venezuela → Colombia" },
];

const STATUS_CONFIG: Record<string, { bg: string; text: string }> = {
  COMPLETED: { bg: "bg-success/[0.08]", text: "text-success" },
  PROCESSING: { bg: "bg-primary/[0.08]", text: "text-primary" },
  PENDING: { bg: "bg-warning/[0.08]", text: "text-warning" },
  FAILED: { bg: "bg-destructive/[0.08]", text: "text-destructive" },
  CANCELLED: { bg: "bg-muted", text: "text-muted-foreground" },
};

export default function RemittanceClient() {
  const { user } = useUserStore();
  const {
    remittances,
    isLoading,
    isSending,
    currentRate,
    estimatedFee,
    fetchRemittances,
    getQuote,
    sendRemittance,
  } = useRemittanceStore();

  const [fromCountry, setFromCountry] = useState("AR");
  const [toCountry, setToCountry] = useState("BR");
  const [amount, setAmount] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientBank, setRecipientBank] = useState("");
  const [recipientAccount, setRecipientAccount] = useState("");
  const [quoteResult, setQuoteResult] = useState<{
    rate: number;
    fee: number;
    toAmount: number;
  } | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fromInfo = COUNTRIES.find((c) => c.value === fromCountry)!;
  const toInfo = COUNTRIES.find((c) => c.value === toCountry)!;

  useEffect(() => {
    if (user) {
      fetchRemittances();
    }
  }, [user]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!amount || parseFloat(amount) <= 0) {
      setQuoteResult(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const result = await getQuote({
        fromCurrency: fromInfo.currency,
        toCurrency: toInfo.currency,
        amount: parseFloat(amount),
        fromCountry,
        toCountry,
      });
      if (result) {
        setQuoteResult(result);
      }
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [amount, fromCountry, toCountry]);

  const completedRemittances = remittances.filter(
    (r) => r.status === "COMPLETED"
  );
  const totalSent = completedRemittances.reduce(
    (sum, r) => sum + r.fromAmount,
    0
  );
  const totalFees = completedRemittances.reduce((sum, r) => sum + r.fee, 0);
  const avgFee =
    completedRemittances.length > 0
      ? totalFees / completedRemittances.length
      : 0;
  const tradFee = totalSent * 0.06;
  const saved = tradFee - totalFees;

  const handleSend = async () => {
    if (!amount || !recipientName || !recipientBank || !recipientAccount) return;
    const result = await sendRemittance({
      recipientName,
      recipientBank,
      recipientAccount,
      fromCurrency: fromInfo.currency,
      toCurrency: toInfo.currency,
      fromAmount: parseFloat(amount),
      fromCountry,
      toCountry,
    });
    if (result.success) {
      setAmount("");
      setRecipientName("");
      setRecipientBank("");
      setRecipientAccount("");
      setQuoteResult(null);
      fetchRemittances();
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <UserDashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.02em]">
            Send Money
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Cross-border transfers at near-zero cost
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-primary/[0.08]">
                <DollarSign className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                Total Sent
              </span>
            </div>
            <div className="text-[20px] font-extrabold">
              ${totalSent.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-success/[0.08]">
                <TrendingDown className="w-4 h-4 text-success" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                Saved in Fees
              </span>
            </div>
            <div className="text-[20px] font-extrabold text-success">
              ${saved > 0 ? saved.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "0.00"}
            </div>
          </div>
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-primary/[0.08]">
                <Send className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                Transfers
              </span>
            </div>
            <div className="text-[20px] font-extrabold">
              {remittances.length}
            </div>
          </div>
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-primary/[0.08]">
                <BarChart3 className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                Avg Fee
              </span>
            </div>
            <div className="text-[20px] font-extrabold">
              ${avgFee.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Send Form */}
          <div className="space-y-4">
            <h2 className="text-[18px] font-bold">New Transfer</h2>

            <div className="bg-card border border-border p-6">
              {/* Country Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-end">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground block mb-1.5">
                    From Country
                  </label>
                  <select
                    value={fromCountry}
                    onChange={(e) => setFromCountry(e.target.value)}
                    className="w-full px-3 py-2.5 text-[13px] bg-background dark:bg-[#21262D] border border-border dark:border-[rgba(230,237,243,0.1)] text-foreground cursor-pointer focus:border-primary focus:outline-none"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.flag} {c.label} ({c.currency})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-center py-2 sm:py-0">
                  <div className="w-9 h-9 flex items-center justify-center bg-primary/[0.08]">
                    <ArrowRight className="w-4 h-4 text-primary" />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground block mb-1.5">
                    To Country
                  </label>
                  <select
                    value={toCountry}
                    onChange={(e) => setToCountry(e.target.value)}
                    className="w-full px-3 py-2.5 text-[13px] bg-background dark:bg-[#21262D] border border-border dark:border-[rgba(230,237,243,0.1)] text-foreground cursor-pointer focus:border-primary focus:outline-none"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.flag} {c.label} ({c.currency})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Amount */}
              <div className="mt-4">
                <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground block mb-1.5">
                  Amount ({fromInfo.currency})
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3.5 py-3 text-lg font-extrabold bg-background dark:bg-[#21262D] border border-border dark:border-[rgba(230,237,243,0.1)] text-foreground tabular-nums focus:border-primary focus:outline-none"
                />
              </div>

              {/* Live Rate Quote */}
              {quoteResult && (
                <div className="mt-4 p-3 bg-[var(--quatava-blue-100)] dark:bg-[rgba(51,117,187,0.1)]">
                  <div className="flex justify-between text-[13px] mb-1">
                    <span className="text-muted-foreground">Rate</span>
                    <span className="font-extrabold tabular-nums">
                      1 {fromInfo.currency} = {quoteResult.rate.toLocaleString("en-US", { maximumFractionDigits: 6 })}{" "}
                      {toInfo.currency}
                    </span>
                  </div>
                  <div className="flex justify-between text-[13px] mb-1">
                    <span className="text-muted-foreground">Fee</span>
                    <span className="font-semibold tabular-nums">
                      {quoteResult.fee.toLocaleString("en-US", { maximumFractionDigits: 2 })}{" "}
                      {fromInfo.currency}
                    </span>
                  </div>
                  <div className="flex justify-between text-[14px] font-bold pt-2 border-t border-border">
                    <span>Recipient gets</span>
                    <span className="text-success font-extrabold tabular-nums">
                      {quoteResult.toAmount.toLocaleString("en-US", { maximumFractionDigits: 2 })}{" "}
                      {toInfo.currency}
                    </span>
                  </div>
                </div>
              )}

              {/* Recipient Details */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground mb-3">
                  Recipient Details
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground block mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="Recipient's full name"
                      className="w-full px-3 py-2.5 text-[13px] bg-background dark:bg-[#21262D] border border-border dark:border-[rgba(230,237,243,0.1)] text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground block mb-1.5">
                        Bank
                      </label>
                      <input
                        type="text"
                        value={recipientBank}
                        onChange={(e) => setRecipientBank(e.target.value)}
                        placeholder="Bank name"
                        className="w-full px-3 py-2.5 text-[13px] bg-background dark:bg-[#21262D] border border-border dark:border-[rgba(230,237,243,0.1)] text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground block mb-1.5">
                        Account Number
                      </label>
                      <input
                        type="text"
                        value={recipientAccount}
                        onChange={(e) => setRecipientAccount(e.target.value)}
                        placeholder="Account number"
                        className="w-full px-3 py-2.5 text-[13px] bg-background dark:bg-[#21262D] border border-border dark:border-[rgba(230,237,243,0.1)] text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Send Button */}
              <button
                onClick={handleSend}
                disabled={
                  isSending ||
                  !amount ||
                  !recipientName ||
                  !recipientBank ||
                  !recipientAccount
                }
                className="w-full py-3.5 text-[15px] font-extrabold bg-success text-white border-none cursor-pointer mt-5 hover:bg-[#059669] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Money
                  </>
                )}
              </button>
            </div>

            {/* Recent Transfers */}
            <div className="mt-6">
              <h2 className="text-[18px] font-bold mb-4">Recent Transfers</h2>
              {isLoading ? (
                <div className="bg-card border border-border p-5 animate-pulse">
                  <div className="h-5 bg-muted w-1/3 mb-3" />
                  <div className="h-4 bg-muted w-2/3" />
                </div>
              ) : remittances.length > 0 ? (
                <div className="bg-card border border-border overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground p-3">
                          Date
                        </th>
                        <th className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground p-3">
                          Recipient
                        </th>
                        <th className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground p-3">
                          Route
                        </th>
                        <th className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground p-3">
                          Sent
                        </th>
                        <th className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground p-3">
                          Received
                        </th>
                        <th className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground p-3">
                          Fee
                        </th>
                        <th className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground p-3">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {remittances.map((r) => {
                        const sc = STATUS_CONFIG[r.status] || STATUS_CONFIG.PENDING;
                        return (
                          <tr
                            key={r.id}
                            className="border-b border-border last:border-0"
                          >
                            <td className="p-3 text-[12px] text-muted-foreground whitespace-nowrap">
                              {formatDate(r.createdAt)}
                            </td>
                            <td className="p-3 text-[13px] font-semibold">
                              {r.recipientName}
                            </td>
                            <td className="p-3 text-[12px] text-muted-foreground whitespace-nowrap">
                              {r.fromCountry} → {r.toCountry}
                            </td>
                            <td className="p-3 text-[13px] font-semibold tabular-nums">
                              {r.fromAmount.toLocaleString()} {r.fromCurrency}
                            </td>
                            <td className="p-3 text-[13px] font-semibold text-success tabular-nums">
                              {r.toAmount.toLocaleString()} {r.toCurrency}
                            </td>
                            <td className="p-3 text-[13px] tabular-nums">
                              {r.fee.toLocaleString()} {r.fromCurrency}
                            </td>
                            <td className="p-3">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 text-[11px] font-bold uppercase ${sc.bg} ${sc.text}`}
                              >
                                {r.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-card border border-border p-8 text-center">
                  <Send className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-[14px] font-semibold">No transfers yet</p>
                  <p className="text-[13px] text-muted-foreground mt-1">
                    Your transfer history will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Supported Corridors */}
            <h2 className="text-[18px] font-bold">Popular Corridors</h2>
            <div className="bg-card border border-border p-4">
              <div className="flex flex-col gap-2">
                {CORRIDORS.map((corridor, i) => {
                  const fromC = COUNTRIES.find((c) => c.value === corridor.from);
                  const toC = COUNTRIES.find((c) => c.value === corridor.to);
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        setFromCountry(corridor.from);
                        setToCountry(corridor.to);
                      }}
                      className="flex items-center gap-2 p-2.5 text-left border border-border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <span className="text-[16px]">{fromC?.flag}</span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[16px]">{toC?.flag}</span>
                      <span className="text-[12px] font-semibold ml-1">
                        {fromC?.currency} → {toC?.currency}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-card border border-border p-4">
              <h3 className="font-extrabold text-sm mb-4">How It Works</h3>
              <div className="flex flex-col gap-3 text-[13px]">
                {[
                  {
                    icon: Globe,
                    text: "Select origin and destination countries",
                  },
                  {
                    icon: DollarSign,
                    text: "Enter amount and get an instant quote",
                  },
                  {
                    icon: Users,
                    text: "Add recipient bank details",
                  },
                  {
                    icon: CheckCircle,
                    text: "Funds arrive in minutes, not days",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 flex items-center justify-center bg-primary/[0.08] shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-primary">
                        {i + 1}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <item.icon className="w-4 h-4 text-success shrink-0 mt-0.5" />
                      <span>{item.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </UserDashboardShell>
  );
}
