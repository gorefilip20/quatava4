"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Banknote,
  Copy,
  Settings,
  ArrowRight,
  Check,
  Building2,
  Loader2,
  Percent,
} from "lucide-react";
import { usePayrollStore, type PayrollDeposit } from "@/store/payroll/payroll-store";
import { useUserStore } from "@/store/user";
import { UserDashboardShell } from "@/components/layout/user-dashboard-shell";

const RECEIVE_CURRENCIES = [
  { value: "USDT", label: "USDT - Tether" },
  { value: "USDC", label: "USDC - USD Coin" },
  { value: "BTC", label: "BTC - Bitcoin" },
];

const STEPS = [
  {
    step: 1,
    title: "Share Your Address",
    desc: "Copy your unique deposit address and share it with your employer or HR department.",
  },
  {
    step: 2,
    title: "Employer Sends Crypto",
    desc: "Your employer sends your salary in stablecoins directly to your Quatava wallet.",
  },
  {
    step: 3,
    title: "Auto-Convert",
    desc: "Quatava automatically converts a portion to your preferred currency at best rates.",
  },
  {
    step: 4,
    title: "Withdraw to Bank",
    desc: "Funds are withdrawn to your linked bank account automatically.",
  },
];

const BENEFITS = [
  "Protection from local currency devaluation",
  "Instant settlement - no banking delays",
  "Lower fees than traditional payroll",
  "Auto-convert to stablecoins on arrival",
  "Withdraw to bank on your schedule",
];

export default function PayrollClient() {
  const { user } = useUserStore();
  const {
    deposits,
    config,
    isLoading,
    isSaving,
    fetchDeposits,
    fetchConfig,
    saveConfig,
  } = usePayrollStore();

  const [receiveCurrency, setReceiveCurrency] = useState("USDT");
  const [autoConvert, setAutoConvert] = useState(false);
  const [convertPercentage, setConvertPercentage] = useState(50);
  const [autoWithdraw, setAutoWithdraw] = useState(false);
  const [withdrawPercentage, setWithdrawPercentage] = useState(100);
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [copied, setCopied] = useState(false);

  const depositAddress = "0x7a3B...f9E2c4D8b1A5e6F3...8d2C";

  useEffect(() => {
    if (user) {
      fetchDeposits();
      fetchConfig();
    }
  }, [user]);

  useEffect(() => {
    if (config) {
      setReceiveCurrency(config.receiveCurrency || "USDT");
      setAutoConvert(config.autoConvert || false);
      setConvertPercentage(config.convertPercentage || 50);
      setAutoWithdraw(config.withdrawPercentage > 0);
      setWithdrawPercentage(config.withdrawPercentage || 100);
      setBankName(config.bankName || "");
      setBankAccount(config.bankAccount || "");
    }
  }, [config]);

  const completedDeposits = useMemo(
    () => deposits.filter((d) => d.status === "COMPLETED"),
    [deposits]
  );

  const totalReceived = useMemo(
    () => completedDeposits.reduce((sum, d) => sum + d.amount, 0),
    [completedDeposits]
  );

  const thisMonth = useMemo(() => {
    const now = new Date();
    return completedDeposits
      .filter((d) => {
        const date = new Date(d.createdAt);
        return (
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, d) => sum + d.amount, 0);
  }, [completedDeposits]);

  const autoConverted = useMemo(
    () =>
      completedDeposits
        .filter((d) => d.convertPercentage && d.convertPercentage > 0)
        .reduce(
          (sum, d) => sum + d.amount * ((d.convertPercentage || 0) / 100),
          0
        ),
    [completedDeposits]
  );

  const savedFromDevaluation = useMemo(
    () => totalReceived * 0.12,
    [totalReceived]
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(depositAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleSaveConfig = async () => {
    await saveConfig({
      receiveCurrency,
      autoConvert,
      convertToCurrency: receiveCurrency,
      convertPercentage: autoConvert ? convertPercentage : 0,
      withdrawPercentage: autoWithdraw ? withdrawPercentage : 0,
      bankName: autoWithdraw ? bankName : undefined,
      bankAccount: autoWithdraw ? bankAccount : undefined,
    });
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

  const statusBadge = (status: PayrollDeposit["status"]) => {
    const styles: Record<string, string> = {
      COMPLETED: "bg-[#10B981]/[0.08] text-[#10B981]",
      PENDING: "bg-yellow-500/[0.08] text-yellow-600 dark:text-yellow-400",
      FAILED: "bg-red-500/[0.08] text-red-600 dark:text-red-400",
    };
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 text-[11px] font-bold uppercase ${styles[status] || ""}`}
      >
        {status}
      </span>
    );
  };

  return (
    <UserDashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.02em]">
            Crypto Payroll
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Receive your salary in stablecoins — protect your income from
            devaluation
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-primary/[0.08]">
                <Banknote className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                Total Received
              </span>
            </div>
            <div className="text-[20px] font-extrabold">
              $
              {totalReceived.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </div>
          </div>
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-primary/[0.08]">
                <Banknote className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                This Month
              </span>
            </div>
            <div className="text-[20px] font-extrabold">
              $
              {thisMonth.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </div>
          </div>
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-[#10B981]/[0.08]">
                <Percent className="w-4 h-4 text-[#10B981]" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                Auto-Converted
              </span>
            </div>
            <div className="text-[20px] font-extrabold text-[#10B981]">
              $
              {autoConverted.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </div>
          </div>
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-[#10B981]/[0.08]">
                <Check className="w-4 h-4 text-[#10B981]" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                Saved from Devaluation
              </span>
            </div>
            <div className="text-[20px] font-extrabold text-[#10B981]">
              ~$
              {savedFromDevaluation.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </div>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* Left Panel */}
          <div className="space-y-6">
            {/* Deposit Address */}
            <div className="bg-card border border-border p-6">
              <h2 className="text-[18px] font-bold mb-1">
                Your Deposit Address
              </h2>
              <p className="text-[12px] text-muted-foreground mb-4">
                Share this address with your employer to receive crypto payroll
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-primary/[0.08] border border-border p-4 font-mono text-[14px] font-bold text-primary break-all">
                  {depositAddress}
                </div>
                <button
                  onClick={handleCopy}
                  className="w-12 h-12 flex items-center justify-center bg-primary text-white shrink-0 hover:bg-primary/90 transition-colors"
                >
                  {copied ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
              {copied && (
                <p className="text-[12px] text-[#10B981] mt-2 font-semibold">
                  Address copied to clipboard
                </p>
              )}
            </div>

            {/* Configuration Panel */}
            <div className="bg-card border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-primary" />
                <h2 className="text-[18px] font-bold">
                  Payroll Configuration
                </h2>
              </div>

              <div className="space-y-5">
                {/* Receive Currency */}
                <div>
                  <label className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block mb-1.5">
                    Receive Currency
                  </label>
                  <select
                    value={receiveCurrency}
                    onChange={(e) => setReceiveCurrency(e.target.value)}
                    className="w-full p-3 text-[13px] bg-card border border-border text-foreground outline-none"
                  >
                    {RECEIVE_CURRENCIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Auto-Convert Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[13px] font-semibold block">
                      Auto-Convert on Arrival
                    </span>
                    <span className="text-[12px] text-muted-foreground">
                      Automatically convert a portion upon receiving
                    </span>
                  </div>
                  <button
                    onClick={() => setAutoConvert(!autoConvert)}
                    className={`w-11 h-6 relative transition-colors ${
                      autoConvert ? "bg-[#10B981]" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 bg-white transition-transform ${
                        autoConvert ? "left-[22px]" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>

                {/* Convert Percentage Slider */}
                {autoConvert && (
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block mb-1.5">
                      Convert Percentage: {convertPercentage}%
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={convertPercentage}
                      onChange={(e) =>
                        setConvertPercentage(parseInt(e.target.value))
                      }
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                )}

                {/* Auto-Withdraw Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[13px] font-semibold block">
                      Auto-Withdraw to Bank
                    </span>
                    <span className="text-[12px] text-muted-foreground">
                      Automatically send funds to your bank account
                    </span>
                  </div>
                  <button
                    onClick={() => setAutoWithdraw(!autoWithdraw)}
                    className={`w-11 h-6 relative transition-colors ${
                      autoWithdraw ? "bg-[#10B981]" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 bg-white transition-transform ${
                        autoWithdraw ? "left-[22px]" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>

                {autoWithdraw && (
                  <>
                    {/* Withdraw Percentage */}
                    <div>
                      <label className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block mb-1.5">
                        Withdraw Percentage: {withdrawPercentage}%
                      </label>
                      <input
                        type="range"
                        min={10}
                        max={100}
                        step={5}
                        value={withdrawPercentage}
                        onChange={(e) =>
                          setWithdrawPercentage(parseInt(e.target.value))
                        }
                        className="w-full accent-primary"
                      />
                    </div>

                    {/* Bank Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block mb-1.5">
                          Bank Name
                        </label>
                        <input
                          type="text"
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          placeholder="e.g. Banco Galicia"
                          className="w-full p-3 text-[13px] bg-card border border-border text-foreground placeholder:text-muted-foreground outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block mb-1.5">
                          Account Number
                        </label>
                        <input
                          type="text"
                          value={bankAccount}
                          onChange={(e) => setBankAccount(e.target.value)}
                          placeholder="e.g. 0720000088000012345"
                          className="w-full p-3 text-[13px] bg-card border border-border text-foreground placeholder:text-muted-foreground outline-none"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Save Button */}
                <button
                  onClick={handleSaveConfig}
                  disabled={isSaving}
                  className="w-full py-3 bg-primary text-white text-[14px] font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Save Configuration
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Recent Deposits */}
            <div className="bg-card border border-border p-6">
              <h2 className="text-[18px] font-bold mb-4">Recent Deposits</h2>

              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-muted w-full mb-2" />
                      <div className="h-4 bg-muted w-2/3" />
                    </div>
                  ))}
                </div>
              ) : deposits.length === 0 ? (
                <div className="text-center py-10">
                  <Banknote className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-[14px] font-semibold text-muted-foreground">
                    No deposits yet
                  </p>
                  <p className="text-[12px] text-muted-foreground mt-1">
                    Share your deposit address with your employer to get started
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold pb-2 pr-4">
                          Employer
                        </th>
                        <th className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold pb-2 pr-4">
                          Amount
                        </th>
                        <th className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold pb-2 pr-4">
                          Currency
                        </th>
                        <th className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold pb-2 pr-4">
                          Status
                        </th>
                        <th className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold pb-2">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {deposits.map((d) => (
                        <tr
                          key={d.id}
                          className="border-b border-border last:border-0"
                        >
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 flex items-center justify-center bg-primary/[0.08]">
                                <Building2 className="w-3.5 h-3.5 text-primary" />
                              </div>
                              <span className="text-[13px] font-semibold">
                                {d.employerName}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 pr-4 text-[13px] font-bold">
                            {d.amount.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td className="py-3 pr-4 text-[13px] text-muted-foreground">
                            {d.currency}
                          </td>
                          <td className="py-3 pr-4">{statusBadge(d.status)}</td>
                          <td className="py-3 text-[12px] text-muted-foreground">
                            {formatDate(d.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Share with Employer */}
            <div className="bg-primary/[0.08] border border-primary/20 p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 flex items-center justify-center bg-primary text-white shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold mb-1">
                    Share with Your Employer
                  </h3>
                  <p className="text-[13px] text-muted-foreground mb-3">
                    Send your employer the deposit address above along with the
                    preferred currency. They can set up recurring payments
                    directly to your Quatava wallet. No intermediaries, no
                    delays.
                  </p>
                  <button
                    onClick={handleCopy}
                    className="px-4 py-2 bg-primary text-white text-[13px] font-bold flex items-center gap-1.5 hover:bg-primary/90 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy Address to Share
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* How Payroll Works */}
            <div className="bg-card border border-border p-5">
              <h3 className="text-[16px] font-bold mb-4">
                How Payroll Works
              </h3>
              <div className="space-y-4">
                {STEPS.map((s) => (
                  <div key={s.step} className="flex gap-3">
                    <div className="w-8 h-8 flex items-center justify-center bg-primary text-white text-[13px] font-extrabold shrink-0">
                      {s.step}
                    </div>
                    <div>
                      <h4 className="text-[13px] font-bold">{s.title}</h4>
                      <p className="text-[12px] text-muted-foreground mt-0.5">
                        {s.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Benefits */}
            <div className="bg-card border border-border p-5">
              <h3 className="text-[16px] font-bold mb-3">Benefits</h3>
              <ul className="space-y-2.5">
                {BENEFITS.map((b, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-[#10B981] mt-0.5 shrink-0" />
                    <span className="text-[13px] text-muted-foreground">
                      {b}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Supported Currencies */}
            <div className="bg-card border border-border p-5">
              <h3 className="text-[16px] font-bold mb-3">
                Supported Currencies
              </h3>
              <div className="space-y-2">
                {RECEIVE_CURRENCIES.map((c) => (
                  <div
                    key={c.value}
                    className="flex items-center gap-2 p-2 border border-border"
                  >
                    <div className="w-6 h-6 flex items-center justify-center bg-primary/[0.08] text-[10px] font-extrabold text-primary">
                      {c.value[0]}
                    </div>
                    <span className="text-[13px] font-semibold">
                      {c.label}
                    </span>
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
