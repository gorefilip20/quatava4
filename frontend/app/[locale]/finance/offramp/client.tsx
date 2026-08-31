"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownToLine,
  Building2,
  Zap,
  Clock,
  DollarSign,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useWalletStore } from "@/store/finance/wallet-store";
import { useUserStore } from "@/store/user";
import { UserDashboardShell } from "@/components/layout/user-dashboard-shell";
import { $fetch } from "@/lib/api";

const CRYPTOS = [
  { value: "BTC", label: "Bitcoin (BTC)" },
  { value: "ETH", label: "Ethereum (ETH)" },
  { value: "USDT", label: "Tether (USDT)" },
  { value: "USDC", label: "USD Coin (USDC)" },
  { value: "SOL", label: "Solana (SOL)" },
];

const LOCAL_CURRENCIES = [
  { value: "BRL", label: "Brazilian Real", flag: "\u{1F1E7}\u{1F1F7}" },
  { value: "ARS", label: "Argentine Peso", flag: "\u{1F1E6}\u{1F1F7}" },
  { value: "COP", label: "Colombian Peso", flag: "\u{1F1E8}\u{1F1F4}" },
  { value: "CLP", label: "Chilean Peso", flag: "\u{1F1E8}\u{1F1F1}" },
  { value: "PEN", label: "Peruvian Sol", flag: "\u{1F1F5}\u{1F1EA}" },
  { value: "MXN", label: "Mexican Peso", flag: "\u{1F1F2}\u{1F1FD}" },
];

const ACCOUNT_TYPES = [
  { value: "checking", label: "Checking Account" },
  { value: "savings", label: "Savings Account" },
  { value: "pix", label: "PIX (Brazil)" },
  { value: "cbu", label: "CBU (Argentina)" },
];

const SUPPORTED_BANKS: Record<string, string[]> = {
  BRL: ["Banco do Brasil", "Itau", "Bradesco", "Nubank", "Inter", "C6 Bank"],
  ARS: ["Banco Nacion", "Galicia", "Santander", "BBVA", "Brubank", "Uala"],
  COP: ["Bancolombia", "Davivienda", "Nequi", "BBVA", "Banco de Bogota"],
  CLP: ["BancoEstado", "Banco de Chile", "Santander", "BCI", "Falabella"],
  PEN: ["BCP", "Interbank", "BBVA", "Scotiabank", "Yape"],
  MXN: ["BBVA Mexico", "Banorte", "Santander", "Citibanamex", "Nu Mexico"],
};

interface Withdrawal {
  id: string;
  crypto: string;
  cryptoAmount: number;
  fiatCurrency: string;
  fiatAmount: number;
  bankName: string;
  status: "COMPLETED" | "PROCESSING" | "PENDING" | "FAILED";
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string }> = {
  COMPLETED: { bg: "bg-success/[0.08]", text: "text-success" },
  PROCESSING: { bg: "bg-primary/[0.08]", text: "text-primary" },
  PENDING: { bg: "bg-warning/[0.08]", text: "text-warning" },
  FAILED: { bg: "bg-destructive/[0.08]", text: "text-destructive" },
};

export default function OfframpClient() {
  const { user } = useUserStore();
  const { totalBalance, fetchWallets, isLoading: walletsLoading } = useWalletStore();

  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoadingWithdrawals, setIsLoadingWithdrawals] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedCrypto, setSelectedCrypto] = useState("USDT");
  const [selectedFiat, setSelectedFiat] = useState("BRL");
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountType, setAccountType] = useState("checking");

  useEffect(() => {
    if (user) {
      fetchWallets();
      fetchWithdrawals();
    }
  }, [user]);

  const fetchWithdrawals = async () => {
    setIsLoadingWithdrawals(true);
    try {
      const { data, error } = await $fetch<Withdrawal[]>({
        url: "/api/finance/withdraw",
        silent: true,
      });
      if (!error && data) {
        setWithdrawals(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching withdrawals:", err);
    } finally {
      setIsLoadingWithdrawals(false);
    }
  };

  const handleCashOut = async () => {
    if (!amount || !bankName || !accountNumber) return;
    setIsSubmitting(true);
    try {
      const { error } = await $fetch({
        url: "/api/finance/withdraw",
        method: "POST",
        body: {
          crypto: selectedCrypto,
          amount: parseFloat(amount),
          fiatCurrency: selectedFiat,
          bankName,
          accountNumber,
          accountType,
        },
        successMessage: "Cash out initiated successfully",
      });
      if (!error) {
        setAmount("");
        setBankName("");
        setAccountNumber("");
        fetchWithdrawals();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const todaysWithdrawals = withdrawals.filter((w) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      return w.createdAt?.startsWith(today);
    } catch {
      return false;
    }
  });

  const todaysTotal = todaysWithdrawals.reduce((s, w) => s + (w.fiatAmount || 0), 0);
  const completedCount = withdrawals.filter((w) => w.status === "COMPLETED").length;

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

  const currencyInfo = LOCAL_CURRENCIES.find((c) => c.value === selectedFiat);
  const banks = SUPPORTED_BANKS[selectedFiat] || [];

  return (
    <UserDashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.02em]">
            Instant Cash Out
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Convert crypto to local currency — straight to your bank in seconds
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
                Available Balance
              </span>
            </div>
            <div className="text-[20px] font-extrabold tabular-nums">
              ${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-success/[0.08]">
                <ArrowDownToLine className="w-4 h-4 text-success" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                Today's Withdrawals
              </span>
            </div>
            <div className="text-[20px] font-extrabold tabular-nums">
              ${todaysTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-primary/[0.08]">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                Fastest Settlement
              </span>
            </div>
            <div className="text-[20px] font-extrabold">
              &lt; 60s
            </div>
          </div>
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-primary/[0.08]">
                <Building2 className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                Supported Banks
              </span>
            </div>
            <div className="text-[20px] font-extrabold">
              {Object.values(SUPPORTED_BANKS).flat().length}+
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* Cash Out Form */}
          <div className="space-y-4">
            <h2 className="text-[18px] font-bold">Cash Out</h2>
            <div className="bg-card border border-border p-6">
              {/* Crypto Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground block mb-1.5">
                    Sell Crypto
                  </label>
                  <select
                    value={selectedCrypto}
                    onChange={(e) => setSelectedCrypto(e.target.value)}
                    className="w-full px-3 py-2.5 text-[13px] bg-background dark:bg-[#21262D] border border-border dark:border-[rgba(230,237,243,0.1)] text-foreground cursor-pointer focus:border-primary focus:outline-none"
                  >
                    {CRYPTOS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground block mb-1.5">
                    Receive In
                  </label>
                  <select
                    value={selectedFiat}
                    onChange={(e) => setSelectedFiat(e.target.value)}
                    className="w-full px-3 py-2.5 text-[13px] bg-background dark:bg-[#21262D] border border-border dark:border-[rgba(230,237,243,0.1)] text-foreground cursor-pointer focus:border-primary focus:outline-none"
                  >
                    {LOCAL_CURRENCIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.flag} {c.label} ({c.value})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Amount */}
              <div className="mt-4">
                <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground block mb-1.5">
                  Amount ({selectedCrypto})
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

              {/* Bank Details */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground mb-3">
                  Bank Details
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground block mb-1.5">
                      Bank / Recipient Name
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="Full name on bank account"
                      className="w-full px-3 py-2.5 text-[13px] bg-background dark:bg-[#21262D] border border-border dark:border-[rgba(230,237,243,0.1)] text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground block mb-1.5">
                        Account Number
                      </label>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="Account / PIX / CBU"
                        className="w-full px-3 py-2.5 text-[13px] bg-background dark:bg-[#21262D] border border-border dark:border-[rgba(230,237,243,0.1)] text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground block mb-1.5">
                        Account Type
                      </label>
                      <select
                        value={accountType}
                        onChange={(e) => setAccountType(e.target.value)}
                        className="w-full px-3 py-2.5 text-[13px] bg-background dark:bg-[#21262D] border border-border dark:border-[rgba(230,237,243,0.1)] text-foreground cursor-pointer focus:border-primary focus:outline-none"
                      >
                        {ACCOUNT_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Speed Badge */}
              <div className="mt-4 p-3 bg-success/[0.06] flex items-center gap-2">
                <Zap className="w-4 h-4 text-success" />
                <span className="text-[13px] font-semibold text-success">
                  Settlement time: &lt; 60 seconds
                </span>
              </div>

              {/* Cash Out Button */}
              <button
                onClick={handleCashOut}
                disabled={isSubmitting || !amount || !bankName || !accountNumber}
                className="w-full py-3.5 text-[15px] font-extrabold bg-success text-white border-none cursor-pointer mt-5 hover:bg-[#059669] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ArrowDownToLine className="w-4 h-4" />
                    Cash Out
                  </>
                )}
              </button>
            </div>

            {/* Recent Withdrawals */}
            <div className="mt-6">
              <h2 className="text-[18px] font-bold mb-4">Recent Withdrawals</h2>
              {isLoadingWithdrawals ? (
                <div className="bg-card border border-border p-5 animate-pulse">
                  <div className="h-5 bg-muted w-1/3 mb-3" />
                  <div className="h-4 bg-muted w-2/3" />
                </div>
              ) : withdrawals.length > 0 ? (
                <div className="bg-card border border-border overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground p-3">
                          Date
                        </th>
                        <th className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground p-3">
                          Crypto
                        </th>
                        <th className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground p-3">
                          Amount
                        </th>
                        <th className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground p-3">
                          Received
                        </th>
                        <th className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground p-3">
                          Bank
                        </th>
                        <th className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground p-3">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {withdrawals.map((w) => {
                        const sc = STATUS_CONFIG[w.status] || STATUS_CONFIG.PENDING;
                        return (
                          <tr key={w.id} className="border-b border-border last:border-0">
                            <td className="p-3 text-[12px] text-muted-foreground whitespace-nowrap">
                              {formatDate(w.createdAt)}
                            </td>
                            <td className="p-3 text-[13px] font-semibold">
                              {w.crypto}
                            </td>
                            <td className="p-3 text-[13px] font-semibold tabular-nums">
                              {w.cryptoAmount?.toLocaleString()} {w.crypto}
                            </td>
                            <td className="p-3 text-[13px] font-semibold text-success tabular-nums">
                              {w.fiatAmount?.toLocaleString()} {w.fiatCurrency}
                            </td>
                            <td className="p-3 text-[12px] text-muted-foreground">
                              {w.bankName}
                            </td>
                            <td className="p-3">
                              <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-bold uppercase ${sc.bg} ${sc.text}`}>
                                {w.status}
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
                  <ArrowDownToLine className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-[14px] font-semibold">No withdrawals yet</p>
                  <p className="text-[13px] text-muted-foreground mt-1">
                    Your cash out history will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Supported Banks */}
            <h2 className="text-[18px] font-bold">
              Supported Banks {currencyInfo ? `(${currencyInfo.flag} ${selectedFiat})` : ""}
            </h2>
            <div className="bg-card border border-border p-4">
              <div className="flex flex-col gap-2">
                {banks.map((bank, i) => (
                  <div key={i} className="flex items-center gap-2.5 p-2 border border-border">
                    <Building2 className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-[13px] font-semibold">{bank}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-border">
                <div className="text-[11px] text-muted-foreground font-semibold">
                  Select a currency above to see supported banks
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {LOCAL_CURRENCIES.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setSelectedFiat(c.value)}
                      className={`px-2 py-1 text-[11px] font-bold border cursor-pointer transition-colors ${
                        selectedFiat === c.value
                          ? "bg-primary/[0.08] border-primary text-primary"
                          : "bg-card border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {c.flag} {c.value}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-card border border-border p-4">
              <h3 className="font-extrabold text-sm mb-4">How It Works</h3>
              <div className="flex flex-col gap-3 text-[13px]">
                {[
                  {
                    icon: DollarSign,
                    text: "Choose your crypto and local currency",
                  },
                  {
                    icon: Building2,
                    text: "Enter your bank account details",
                  },
                  {
                    icon: Zap,
                    text: "Funds arrive in under 60 seconds",
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

            {/* Info Card */}
            <div className="bg-primary/[0.06] border border-primary/20 p-4">
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <div className="text-[13px] font-extrabold">Lightning Fast</div>
                  <p className="text-[12px] text-muted-foreground mt-1">
                    Our off-ramp uses instant settlement rails. Most withdrawals
                    complete in under 60 seconds during business hours.
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
