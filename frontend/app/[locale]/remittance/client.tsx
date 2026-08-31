"use client";

import { useEffect, useState, useRef } from "react";
import {
  Send,
  ArrowRight,
  Loader2,
  CheckCircle,
  Clock,
  Shield,
  Zap,
  ChevronDown,
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

const POPULAR_CORRIDORS = [
  { from: "AR", to: "BR" },
  { from: "CO", to: "MX" },
  { from: "PE", to: "CO" },
  { from: "CL", to: "AR" },
  { from: "VE", to: "CO" },
];

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  COMPLETED: { bg: "bg-success/[0.08]", text: "text-success", label: "Completed" },
  PROCESSING: { bg: "bg-primary/[0.08]", text: "text-primary", label: "Processing" },
  PENDING: { bg: "bg-warning/[0.08]", text: "text-warning", label: "Pending" },
  FAILED: { bg: "bg-destructive/[0.08]", text: "text-destructive", label: "Failed" },
  CANCELLED: { bg: "bg-muted", text: "text-muted-foreground", label: "Cancelled" },
};

function formatWithCommas(value: string): string {
  const num = value.replace(/[^0-9.]/g, "");
  const parts = num.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

function stripCommas(value: string): string {
  return value.replace(/,/g, "");
}

export default function RemittanceClient() {
  const { user } = useUserStore();
  const {
    remittances,
    isLoading,
    isSending,
    fetchRemittances,
    getQuote,
    sendRemittance,
  } = useRemittanceStore();

  const [fromCountry, setFromCountry] = useState("AR");
  const [toCountry, setToCountry] = useState("BR");
  const [amount, setAmount] = useState("");
  const [displayAmount, setDisplayAmount] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientBank, setRecipientBank] = useState("");
  const [recipientAccount, setRecipientAccount] = useState("");
  const [quoteResult, setQuoteResult] = useState<{
    rate: number;
    fee: number;
    toAmount: number;
  } | null>(null);
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

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
    const rawAmount = stripCommas(amount);
    if (!rawAmount || parseFloat(rawAmount) <= 0) {
      setQuoteResult(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const result = await getQuote({
        fromCurrency: fromInfo.currency,
        toCurrency: toInfo.currency,
        amount: parseFloat(rawAmount),
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

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9.]/g, "");
    setAmount(raw);
    setDisplayAmount(formatWithCommas(raw));
  };

  const handleSend = async () => {
    const rawAmount = stripCommas(amount);
    if (!rawAmount || !recipientName || !recipientAccount) return;
    const result = await sendRemittance({
      recipientName,
      recipientBank,
      recipientAccount,
      fromCurrency: fromInfo.currency,
      toCurrency: toInfo.currency,
      fromAmount: parseFloat(rawAmount),
      fromCountry,
      toCountry,
    });
    if (result.success) {
      setAmount("");
      setDisplayAmount("");
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
      });
    } catch {
      return dateStr;
    }
  };

  const selectCorridor = (from: string, to: string) => {
    setFromCountry(from);
    setToCountry(to);
  };

  const rawAmount = stripCommas(amount);
  const canSend = rawAmount && parseFloat(rawAmount) > 0 && recipientName && recipientAccount;

  return (
    <UserDashboardShell>
      <div className="w-full max-w-[560px] mx-auto py-4">
        {/* --- Header --- */}
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-extrabold tracking-[-0.02em]">
            Send Money
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Fast cross-border transfers across Latin America
          </p>
        </div>

        {/* --- Popular corridors --- */}
        <div className="mb-6">
          <span className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground block mb-2">
            Popular Routes
          </span>
          <div className="flex flex-wrap gap-2">
            {POPULAR_CORRIDORS.map((cor) => {
              const f = COUNTRIES.find((c) => c.value === cor.from)!;
              const t = COUNTRIES.find((c) => c.value === cor.to)!;
              const isActive = fromCountry === cor.from && toCountry === cor.to;
              return (
                <button
                  key={`${cor.from}-${cor.to}`}
                  onClick={() => selectCorridor(cor.from, cor.to)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold border cursor-pointer transition-colors ${
                    isActive
                      ? "bg-primary/[0.08] border-primary text-primary"
                      : "bg-card border-border text-foreground hover:bg-muted/50"
                  }`}
                >
                  <span>{f.flag}</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                  <span>{t.flag}</span>
                  <span className="text-muted-foreground">
                    {f.currency}/{t.currency}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* --- Main transfer card --- */}
        <div className="bg-card border border-border">
          {/* YOU SEND section */}
          <div className="p-6 pb-0">
            <span className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground block mb-3">
              You Send
            </span>

            {/* Large amount input */}
            <input
              type="text"
              inputMode="decimal"
              value={displayAmount}
              onChange={handleAmountChange}
              placeholder="0"
              className="w-full text-[48px] font-extrabold text-center bg-transparent border-0 outline-none tabular-nums text-foreground placeholder:text-muted-foreground/30"
              style={{ caretColor: "var(--primary)" }}
            />

            {/* From country selector */}
            <div className="relative mt-3">
              <button
                onClick={() => { setFromOpen(!fromOpen); setToOpen(false); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-[var(--quatava-bg)] dark:bg-[#21262D] border border-border text-[14px] font-semibold cursor-pointer"
              >
                <span className="text-[18px]">{fromInfo.flag}</span>
                <span>{fromInfo.label}</span>
                <span className="text-muted-foreground">({fromInfo.currency})</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground ml-1" />
              </button>
              {fromOpen && (
                <div className="absolute top-full left-0 right-0 bg-card border border-border border-t-0 z-20 max-h-[200px] overflow-y-auto">
                  {COUNTRIES.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => { setFromCountry(c.value); setFromOpen(false); }}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-left border-0 cursor-pointer transition-colors ${
                        c.value === fromCountry
                          ? "bg-primary/[0.08] text-primary"
                          : "bg-transparent text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <span className="text-[16px]">{c.flag}</span>
                      <span>{c.label}</span>
                      <span className="text-muted-foreground ml-auto">{c.currency}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* --- Vertical connector / corridor display --- */}
          <div className="relative py-6 px-6">
            {/* Vertical line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2" />

            {/* Nodes */}
            <div className="relative flex flex-col gap-3 items-center">
              {/* Exchange rate node */}
              <div className="relative z-10 inline-flex items-center gap-2 bg-card border border-border px-4 py-2">
                <span className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground">
                  Rate
                </span>
                <span className="text-[13px] font-extrabold tabular-nums">
                  {quoteResult
                    ? `1 ${fromInfo.currency} = ${quoteResult.rate.toLocaleString("en-US", { maximumFractionDigits: 4 })} ${toInfo.currency}`
                    : `${fromInfo.currency} / ${toInfo.currency}`}
                </span>
              </div>

              {/* Fee node */}
              <div className="relative z-10 inline-flex items-center gap-2 bg-card border border-border px-4 py-2">
                <span className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground">
                  Fee
                </span>
                {quoteResult ? (
                  quoteResult.fee === 0 ? (
                    <span className="text-[13px] font-extrabold text-success">No Fee</span>
                  ) : (
                    <span className="text-[13px] font-extrabold tabular-nums">
                      {quoteResult.fee.toLocaleString("en-US", { maximumFractionDigits: 2 })} {fromInfo.currency}
                    </span>
                  )
                ) : (
                  <span className="text-[13px] font-semibold text-muted-foreground">--</span>
                )}
              </div>

              {/* Delivery time node */}
              <div className="relative z-10 inline-flex items-center gap-2 bg-card border border-border px-4 py-2">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span className="text-[13px] font-extrabold">~2 hours</span>
              </div>
            </div>
          </div>

          {/* THEY RECEIVE section */}
          <div className="p-6 pt-0">
            <span className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground block mb-3">
              They Receive
            </span>

            {/* Received amount display */}
            <div className="text-center">
              <span className="text-[48px] font-extrabold tabular-nums text-success leading-none">
                {quoteResult
                  ? quoteResult.toAmount.toLocaleString("en-US", {
                      maximumFractionDigits: 2,
                    })
                  : "0"}
              </span>
            </div>

            {/* To country selector */}
            <div className="relative mt-3">
              <button
                onClick={() => { setToOpen(!toOpen); setFromOpen(false); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-[var(--quatava-bg)] dark:bg-[#21262D] border border-border text-[14px] font-semibold cursor-pointer"
              >
                <span className="text-[18px]">{toInfo.flag}</span>
                <span>{toInfo.label}</span>
                <span className="text-muted-foreground">({toInfo.currency})</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground ml-1" />
              </button>
              {toOpen && (
                <div className="absolute top-full left-0 right-0 bg-card border border-border border-t-0 z-20 max-h-[200px] overflow-y-auto">
                  {COUNTRIES.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => { setToCountry(c.value); setToOpen(false); }}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-left border-0 cursor-pointer transition-colors ${
                        c.value === toCountry
                          ? "bg-primary/[0.08] text-primary"
                          : "bg-transparent text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <span className="text-[16px]">{c.flag}</span>
                      <span>{c.label}</span>
                      <span className="text-muted-foreground ml-auto">{c.currency}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- Recipient form --- */}
        <div className="bg-card border border-border border-t-0 p-6">
          <span className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground block mb-4">
            Recipient Details
          </span>

          <div className="space-y-3">
            <div>
              <label className="text-[12px] font-semibold text-muted-foreground block mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Recipient's full name"
                className="w-full px-3.5 py-2.5 text-[14px] bg-background dark:bg-[#21262D] border border-border text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-muted-foreground block mb-1">
                Account Number or Phone
              </label>
              <input
                type="text"
                value={recipientAccount}
                onChange={(e) => setRecipientAccount(e.target.value)}
                placeholder="Account number or mobile number"
                className="w-full px-3.5 py-2.5 text-[14px] bg-background dark:bg-[#21262D] border border-border text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-muted-foreground block mb-1">
                Bank
                <span className="text-muted-foreground/60 font-normal ml-1">(optional)</span>
              </label>
              <input
                type="text"
                value={recipientBank}
                onChange={(e) => setRecipientBank(e.target.value)}
                placeholder="Bank name"
                className="w-full px-3.5 py-2.5 text-[14px] bg-background dark:bg-[#21262D] border border-border text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* --- Send button --- */}
        <button
          onClick={handleSend}
          disabled={isSending || !canSend}
          className="w-full py-4 text-[16px] font-extrabold bg-primary text-white border-0 cursor-pointer mt-0 hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isSending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              {quoteResult && rawAmount
                ? `Send ${formatWithCommas(rawAmount)} ${fromInfo.currency}`
                : "Send Money"}
            </>
          )}
        </button>

        {/* --- Recent transfers --- */}
        {user && (
          <div className="mt-10">
            <span className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground block mb-3">
              Recent Transfers
            </span>

            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-card border border-border p-4 animate-pulse">
                    <div className="h-4 bg-muted w-2/3 mb-2" />
                    <div className="h-3 bg-muted w-1/3" />
                  </div>
                ))}
              </div>
            ) : remittances.length > 0 ? (
              <div className="space-y-1">
                {remittances.slice(0, 8).map((r) => {
                  const sc = STATUS_CONFIG[r.status] || STATUS_CONFIG.PENDING;
                  const fromC = COUNTRIES.find((c) => c.value === r.fromCountry);
                  const toC = COUNTRIES.find((c) => c.value === r.toCountry);
                  return (
                    <div
                      key={r.id}
                      className="bg-card border border-border px-4 py-3 flex items-center gap-3"
                    >
                      {/* Flag pair */}
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[16px]">{fromC?.flag || r.fromCountry}</span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[16px]">{toC?.flag || r.toCountry}</span>
                      </div>

                      {/* Recipient + amount */}
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-bold truncate">
                          {r.recipientName}
                        </div>
                        <div className="text-[12px] text-muted-foreground tabular-nums">
                          {r.fromAmount.toLocaleString()} {r.fromCurrency}
                        </div>
                      </div>

                      {/* Status + date */}
                      <div className="text-right shrink-0">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${sc.bg} ${sc.text}`}
                        >
                          {sc.label}
                        </span>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {formatDate(r.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-card border border-border p-8 text-center">
                <Send className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-[13px] font-semibold">No transfers yet</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  Your transfer history will appear here.
                </p>
              </div>
            )}
          </div>
        )}

        {/* --- Trust strip --- */}
        <div className="mt-10 grid grid-cols-3 gap-3">
          {[
            { icon: Shield, label: "Bank-grade encryption" },
            { icon: Zap, label: "Arrives in minutes" },
            { icon: CheckCircle, label: "No hidden fees" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex flex-col items-center text-center gap-1.5 py-3"
              >
                <Icon className="w-4 h-4 text-success" />
                <span className="text-[11px] font-semibold text-muted-foreground leading-tight">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </UserDashboardShell>
  );
}
