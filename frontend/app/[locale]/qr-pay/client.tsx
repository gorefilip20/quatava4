"use client";

import { useEffect, useState } from "react";
import {
  QrCode,
  Camera,
  Send,
  ArrowDownToLine,
  Check,
  Smartphone,
  Store,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { useWalletStore } from "@/store/finance/wallet-store";
import { useUserStore } from "@/store/user";
import { UserDashboardShell } from "@/components/layout/user-dashboard-shell";
import { $fetch } from "@/lib/api";

const PAY_CURRENCIES = [
  { value: "USDT", label: "USDT" },
  { value: "USDC", label: "USDC" },
  { value: "BTC", label: "BTC" },
  { value: "ETH", label: "ETH" },
  { value: "SOL", label: "SOL" },
];

const RECEIVE_CURRENCIES = [
  { value: "USDT", label: "USDT" },
  { value: "BTC", label: "BTC" },
  { value: "ETH", label: "ETH" },
];

interface QrPayment {
  id: string;
  type: "PAY" | "RECEIVE";
  merchantId?: string;
  merchantName?: string;
  amount: number;
  currency: string;
  status: "COMPLETED" | "PENDING" | "FAILED";
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string }> = {
  COMPLETED: { bg: "bg-success/[0.08]", text: "text-success" },
  PENDING: { bg: "bg-warning/[0.08]", text: "text-warning" },
  FAILED: { bg: "bg-destructive/[0.08]", text: "text-destructive" },
};

export default function QrPayClient() {
  const { user } = useUserStore();
  const { fetchWallets } = useWalletStore();

  const [activeTab, setActiveTab] = useState<"pay" | "receive">("pay");
  const [payments, setPayments] = useState<QrPayment[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pay tab state
  const [merchantId, setMerchantId] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payCurrency, setPayCurrency] = useState("USDT");

  // Receive tab state
  const [receiveAmount, setReceiveAmount] = useState("");
  const [receiveCurrency, setReceiveCurrency] = useState("USDT");
  const [generatedQr, setGeneratedQr] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWallets();
      fetchPayments();
    }
  }, [user]);

  const fetchPayments = async () => {
    setIsLoadingPayments(true);
    try {
      const { data, error } = await $fetch<QrPayment[]>({
        url: "/api/finance/qr-pay",
        silent: true,
      });
      if (!error && data) {
        setPayments(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching QR payments:", err);
    } finally {
      setIsLoadingPayments(false);
    }
  };

  const handlePay = async () => {
    if (!merchantId || !payAmount) return;
    setIsSubmitting(true);
    try {
      const { error } = await $fetch({
        url: "/api/finance/qr-pay",
        method: "POST",
        body: {
          type: "PAY",
          merchantId,
          amount: parseFloat(payAmount),
          currency: payCurrency,
        },
        successMessage: "Payment sent successfully",
      });
      if (!error) {
        setMerchantId("");
        setPayAmount("");
        fetchPayments();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateQr = () => {
    if (!receiveAmount) return;
    setGeneratedQr(true);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const totalPaid = payments
    .filter((p) => p.type === "PAY" && p.status === "COMPLETED")
    .reduce((s, p) => s + p.amount, 0);

  const totalReceived = payments
    .filter((p) => p.type === "RECEIVE" && p.status === "COMPLETED")
    .reduce((s, p) => s + p.amount, 0);

  return (
    <UserDashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.02em]">
            QR Pay
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Pay anywhere with crypto — merchants receive local currency
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-primary/[0.08]">
                <Send className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                Total Paid
              </span>
            </div>
            <div className="text-[20px] font-extrabold tabular-nums">
              ${totalPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-success/[0.08]">
                <ArrowDownToLine className="w-4 h-4 text-success" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                Total Received
              </span>
            </div>
            <div className="text-[20px] font-extrabold text-success tabular-nums">
              ${totalReceived.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-primary/[0.08]">
                <QrCode className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                Transactions
              </span>
            </div>
            <div className="text-[20px] font-extrabold">
              {payments.length}
            </div>
          </div>
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-primary/[0.08]">
                <Store className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                Success Rate
              </span>
            </div>
            <div className="text-[20px] font-extrabold">
              {payments.length > 0
                ? `${Math.round(
                    (payments.filter((p) => p.status === "COMPLETED").length /
                      payments.length) *
                      100
                  )}%`
                : "---"}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          <div className="space-y-4">
            {/* Tab Buttons */}
            <div className="flex border-b border-border">
              <button
                onClick={() => setActiveTab("pay")}
                className={`px-5 py-2.5 text-[14px] font-bold border-b-2 -mb-px cursor-pointer transition-colors bg-transparent ${
                  activeTab === "pay"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Pay
              </button>
              <button
                onClick={() => setActiveTab("receive")}
                className={`px-5 py-2.5 text-[14px] font-bold border-b-2 -mb-px cursor-pointer transition-colors bg-transparent ${
                  activeTab === "receive"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Receive
              </button>
            </div>

            {/* Pay Tab */}
            {activeTab === "pay" && (
              <div className="bg-card border border-border p-6">
                {/* Camera / Scanner Placeholder */}
                <div className="flex flex-col items-center mb-6">
                  <div className="w-[200px] h-[200px] border-2 border-dashed border-border flex flex-col items-center justify-center gap-3">
                    <QrCode className="w-12 h-12 text-muted-foreground" />
                    <span className="text-[13px] text-muted-foreground font-semibold">
                      Camera Preview
                    </span>
                  </div>
                  <button className="mt-4 px-6 py-2.5 text-[13px] font-extrabold bg-primary text-white border-none cursor-pointer hover:bg-[#2a619e] transition-colors flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Scan QR Code
                  </button>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.06em]">
                    Or Enter Manually
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Manual Entry */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground block mb-1.5">
                      Merchant ID
                    </label>
                    <input
                      type="text"
                      value={merchantId}
                      onChange={(e) => setMerchantId(e.target.value)}
                      placeholder="Enter merchant ID or address"
                      className="w-full px-3 py-2.5 text-[13px] bg-background dark:bg-[#21262D] border border-border dark:border-[rgba(230,237,243,0.1)] text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground block mb-1.5">
                        Amount
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-3 py-2.5 text-[13px] bg-background dark:bg-[#21262D] border border-border dark:border-[rgba(230,237,243,0.1)] text-foreground tabular-nums focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground block mb-1.5">
                        Pay With
                      </label>
                      <select
                        value={payCurrency}
                        onChange={(e) => setPayCurrency(e.target.value)}
                        className="w-full px-3 py-2.5 text-[13px] bg-background dark:bg-[#21262D] border border-border dark:border-[rgba(230,237,243,0.1)] text-foreground cursor-pointer focus:border-primary focus:outline-none"
                      >
                        {PAY_CURRENCIES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handlePay}
                    disabled={isSubmitting || !merchantId || !payAmount}
                    className="w-full py-3.5 text-[15px] font-extrabold bg-success text-white border-none cursor-pointer mt-3 hover:bg-[#059669] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Pay
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Receive Tab */}
            {activeTab === "receive" && (
              <div className="bg-card border border-border p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground block mb-1.5">
                        Amount
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={receiveAmount}
                        onChange={(e) => {
                          setReceiveAmount(e.target.value);
                          setGeneratedQr(false);
                        }}
                        placeholder="0.00"
                        className="w-full px-3.5 py-3 text-lg font-extrabold bg-background dark:bg-[#21262D] border border-border dark:border-[rgba(230,237,243,0.1)] text-foreground tabular-nums focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground block mb-1.5">
                        Currency
                      </label>
                      <select
                        value={receiveCurrency}
                        onChange={(e) => {
                          setReceiveCurrency(e.target.value);
                          setGeneratedQr(false);
                        }}
                        className="w-full px-3 py-3 text-lg bg-background dark:bg-[#21262D] border border-border dark:border-[rgba(230,237,243,0.1)] text-foreground cursor-pointer focus:border-primary focus:outline-none"
                      >
                        {RECEIVE_CURRENCIES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleGenerateQr}
                    disabled={!receiveAmount}
                    className="w-full py-3 text-[14px] font-extrabold bg-primary text-white border-none cursor-pointer hover:bg-[#2a619e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    <QrCode className="w-4 h-4" />
                    Generate QR
                  </button>

                  {/* QR Placeholder */}
                  {generatedQr && (
                    <div className="mt-4 flex flex-col items-center">
                      <div className="w-[220px] h-[220px] border-2 border-border flex flex-col items-center justify-center gap-3 bg-background">
                        <QrCode className="w-16 h-16 text-foreground" />
                        <span className="text-[14px] font-bold">QR Code</span>
                        <span className="text-[18px] font-extrabold text-primary tabular-nums">
                          {receiveAmount} {receiveCurrency}
                        </span>
                      </div>
                      <p className="text-[12px] text-muted-foreground mt-3 text-center">
                        Show this QR code to receive payment.
                        <br />
                        The sender scans it to pay you instantly.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recent QR Payments */}
            <div className="mt-6">
              <h2 className="text-[18px] font-bold mb-4">Recent QR Payments</h2>
              {isLoadingPayments ? (
                <div className="bg-card border border-border p-5 animate-pulse">
                  <div className="h-5 bg-muted w-1/3 mb-3" />
                  <div className="h-4 bg-muted w-2/3" />
                </div>
              ) : payments.length > 0 ? (
                <div className="bg-card border border-border overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground p-3">
                          Date
                        </th>
                        <th className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground p-3">
                          Type
                        </th>
                        <th className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground p-3">
                          Merchant
                        </th>
                        <th className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground p-3">
                          Amount
                        </th>
                        <th className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground p-3">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => {
                        const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG.PENDING;
                        return (
                          <tr key={p.id} className="border-b border-border last:border-0">
                            <td className="p-3 text-[12px] text-muted-foreground whitespace-nowrap">
                              {formatDate(p.createdAt)}
                            </td>
                            <td className="p-3">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 text-[11px] font-bold uppercase ${
                                  p.type === "PAY"
                                    ? "bg-primary/[0.08] text-primary"
                                    : "bg-success/[0.08] text-success"
                                }`}
                              >
                                {p.type === "PAY" ? "Sent" : "Received"}
                              </span>
                            </td>
                            <td className="p-3 text-[13px] font-semibold">
                              {p.merchantName || p.merchantId || "---"}
                            </td>
                            <td className="p-3 text-[13px] font-semibold tabular-nums">
                              {p.amount.toLocaleString()} {p.currency}
                            </td>
                            <td className="p-3">
                              <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-bold uppercase ${sc.bg} ${sc.text}`}>
                                {p.status}
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
                  <QrCode className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-[14px] font-semibold">No QR payments yet</p>
                  <p className="text-[13px] text-muted-foreground mt-1">
                    Your QR payment history will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* How QR Pay Works */}
            <h2 className="text-[18px] font-bold">How QR Pay Works</h2>
            <div className="bg-card border border-border p-4">
              <div className="flex flex-col gap-3 text-[13px]">
                {[
                  {
                    icon: Camera,
                    title: "Scan or Enter",
                    text: "Scan a merchant's QR code or enter their ID manually",
                  },
                  {
                    icon: Check,
                    title: "Confirm",
                    text: "Review the payment amount and merchant details",
                  },
                  {
                    icon: Send,
                    title: "Pay",
                    text: "Your crypto is converted and sent instantly",
                  },
                  {
                    icon: Store,
                    title: "Done",
                    text: "Merchant receives local currency in seconds",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 flex items-center justify-center bg-primary/[0.08] shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-primary">
                        {i + 1}
                      </span>
                    </div>
                    <div>
                      <div className="font-bold text-[13px]">{item.title}</div>
                      <div className="text-[12px] text-muted-foreground mt-0.5">
                        {item.text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Supported Currencies */}
            <div className="bg-card border border-border p-4">
              <h3 className="font-extrabold text-sm mb-3">Supported Currencies</h3>
              <div className="flex flex-col gap-2">
                {[
                  { symbol: "USDT", name: "Tether", type: "Stablecoin" },
                  { symbol: "USDC", name: "USD Coin", type: "Stablecoin" },
                  { symbol: "BTC", name: "Bitcoin", type: "Crypto" },
                  { symbol: "ETH", name: "Ethereum", type: "Crypto" },
                  { symbol: "SOL", name: "Solana", type: "Crypto" },
                ].map((c) => (
                  <div key={c.symbol} className="flex items-center justify-between p-2 border border-border">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 flex items-center justify-center bg-primary/[0.08] text-[11px] font-extrabold text-primary">
                        {c.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <div className="text-[13px] font-semibold">{c.name}</div>
                        <div className="text-[11px] text-muted-foreground">{c.symbol}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase text-muted-foreground bg-muted px-1.5 py-0.5">
                      {c.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-primary/[0.06] border border-primary/20 p-4">
              <div className="flex items-start gap-2.5">
                <Smartphone className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <div className="text-[13px] font-extrabold">Instant Conversion</div>
                  <p className="text-[12px] text-muted-foreground mt-1">
                    When you pay, your crypto is automatically converted. The
                    merchant always receives their local currency — no crypto
                    knowledge needed on their end.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UserDashboardShell>
  );
}
