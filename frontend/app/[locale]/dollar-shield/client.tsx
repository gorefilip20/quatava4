"use client";

import { useEffect, useState } from "react";
import {
  Shield,
  DollarSign,
  TrendingUp,
  BarChart3,
  Play,
  Pause,
  XCircle,
  Loader2,
  Clock,
  Zap,
  CheckCircle,
  ArrowRight,
  CalendarClock,
  RefreshCw,
} from "lucide-react";
import { useDcaStore, type DcaPlan } from "@/store/dca/dca-store";
import { useUserStore } from "@/store/user";
import { UserDashboardShell } from "@/components/layout/user-dashboard-shell";

const FROM_CURRENCIES = [
  { value: "ARS", label: "ARS - Peso Argentino", flag: "\u{1F1E6}\u{1F1F7}" },
  { value: "BRL", label: "BRL - Real", flag: "\u{1F1E7}\u{1F1F7}" },
  { value: "COP", label: "COP - Peso Colombiano", flag: "\u{1F1E8}\u{1F1F4}" },
  { value: "CLP", label: "CLP - Peso Chileno", flag: "\u{1F1E8}\u{1F1F1}" },
  { value: "PEN", label: "PEN - Sol", flag: "\u{1F1F5}\u{1F1EA}" },
  { value: "MXN", label: "MXN - Peso Mexicano", flag: "\u{1F1F2}\u{1F1FD}" },
];

const TO_CURRENCIES = [
  { value: "USDT", label: "USDT - Tether" },
  { value: "USDC", label: "USDC - USD Coin" },
  { value: "DAI", label: "DAI - Dai" },
];

const FREQUENCIES: { value: DcaPlan["frequency"]; label: string; desc: string }[] = [
  { value: "DAILY", label: "Daily", desc: "Every day" },
  { value: "WEEKLY", label: "Weekly", desc: "Every week" },
  { value: "BIWEEKLY", label: "Biweekly", desc: "Every 2 weeks" },
  { value: "MONTHLY", label: "Monthly", desc: "Every month" },
];

const BENEFITS = [
  {
    icon: Shield,
    title: "Inflation Protection",
    text: "Auto-convert local currency to stablecoins before it loses value",
  },
  {
    icon: TrendingUp,
    title: "Dollar-Cost Averaging",
    text: "Smooth out volatility by investing fixed amounts on a schedule",
  },
  {
    icon: Zap,
    title: "Fully Automated",
    text: "Set it once and your conversions run on autopilot",
  },
  {
    icon: Clock,
    title: "Flexible Scheduling",
    text: "Choose daily, weekly, biweekly, or monthly frequency",
  },
];

export default function DollarShieldClient() {
  const { user } = useUserStore();
  const {
    plans,
    executions,
    isLoading,
    isCreating,
    fetchPlans,
    fetchExecutions,
    createPlan,
    pausePlan,
    resumePlan,
    cancelPlan,
  } = useDcaStore();

  const [fromCurrency, setFromCurrency] = useState("ARS");
  const [toCurrency, setToCurrency] = useState("USDT");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<DcaPlan["frequency"]>("WEEKLY");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchPlans();
    }
  }, [user]);

  useEffect(() => {
    if (selectedPlanId) {
      fetchExecutions(selectedPlanId);
    }
  }, [selectedPlanId]);

  const activePlans = plans.filter((p) => p.status === "ACTIVE");
  const pausedPlans = plans.filter((p) => p.status === "PAUSED");
  const allActivePaused = plans.filter((p) => p.status !== "CANCELLED");

  const totalProtected = plans
    .filter((p) => p.status !== "CANCELLED")
    .reduce((sum, p) => sum + p.totalInvested, 0);
  const totalReceived = plans
    .filter((p) => p.status !== "CANCELLED")
    .reduce((sum, p) => sum + p.totalReceived, 0);
  const avgPrice =
    allActivePaused.length > 0
      ? allActivePaused.reduce((sum, p) => sum + p.averagePrice, 0) /
        allActivePaused.length
      : 0;

  const handleCreate = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    const result = await createPlan({
      fromCurrency,
      toCurrency,
      amount: parseFloat(amount),
      frequency,
    });
    if (result.success) {
      setAmount("");
      fetchPlans();
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
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
            Dollar Shield
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Protect your money from inflation — auto-convert to stablecoins
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-primary/[0.08]">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                Total Protected
              </span>
            </div>
            <div className="text-[20px] font-extrabold">
              ${totalProtected.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-success/[0.08]">
                <Play className="w-4 h-4 text-success" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                Active Plans
              </span>
            </div>
            <div className="text-[20px] font-extrabold text-success">
              {activePlans.length}
            </div>
          </div>
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-primary/[0.08]">
                <BarChart3 className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                Avg Price
              </span>
            </div>
            <div className="text-[20px] font-extrabold">
              ${avgPrice.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
            </div>
          </div>
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-success/[0.08]">
                <DollarSign className="w-4 h-4 text-success" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                Total Received
              </span>
            </div>
            <div className="text-[20px] font-extrabold">
              {totalReceived.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* Active Plans List */}
          <div className="space-y-4">
            <h2 className="text-[18px] font-bold">Your Plans</h2>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-card border border-border p-5 animate-pulse"
                  >
                    <div className="h-5 bg-muted w-1/3 mb-3" />
                    <div className="h-4 bg-muted w-2/3 mb-2" />
                    <div className="h-4 bg-muted w-1/2" />
                  </div>
                ))}
              </div>
            ) : allActivePaused.length > 0 ? (
              <div className="space-y-3">
                {allActivePaused.map((plan) => (
                  <div
                    key={plan.id}
                    className="bg-card border border-border p-5"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center bg-primary/[0.08]">
                          <Shield className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-[14px]">
                            {plan.fromCurrency} → {plan.toCurrency}
                          </h3>
                          <p className="text-[12px] text-muted-foreground">
                            {plan.amount.toLocaleString()} {plan.fromCurrency} ·{" "}
                            {plan.frequency.charAt(0) + plan.frequency.slice(1).toLowerCase()}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-[11px] font-bold uppercase ${
                          plan.status === "ACTIVE"
                            ? "bg-success/[0.08] text-success"
                            : "bg-warning/[0.08] text-warning"
                        }`}
                      >
                        {plan.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
                      <div>
                        <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block">
                          Total Invested
                        </span>
                        <span className="text-[13px] font-semibold">
                          ${plan.totalInvested.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block">
                          Total Received
                        </span>
                        <span className="text-[13px] font-semibold text-success">
                          {plan.totalReceived.toLocaleString()} {plan.toCurrency}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block">
                          Avg Price
                        </span>
                        <span className="text-[13px] font-semibold">
                          ${plan.averagePrice.toLocaleString("en-US", { maximumFractionDigits: 4 })}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block">
                          Executions
                        </span>
                        <span className="text-[13px] font-semibold">
                          {plan.executionCount}
                        </span>
                      </div>
                    </div>

                    {plan.nextExecution && plan.status === "ACTIVE" && (
                      <div className="flex items-center gap-1.5 mt-3 text-[12px] text-muted-foreground">
                        <CalendarClock className="w-3.5 h-3.5" />
                        Next execution: {formatDate(plan.nextExecution)}
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-border flex gap-2">
                      {plan.status === "ACTIVE" ? (
                        <button
                          onClick={() => pausePlan(plan.id)}
                          className="px-4 py-2 text-[13px] font-semibold border border-border text-foreground hover:bg-muted/50 transition-colors flex items-center gap-1.5"
                        >
                          <Pause className="w-3.5 h-3.5" />
                          Pause
                        </button>
                      ) : (
                        <button
                          onClick={() => resumePlan(plan.id)}
                          className="px-4 py-2 text-[13px] font-semibold border border-success text-success hover:bg-success/[0.08] transition-colors flex items-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5" />
                          Resume
                        </button>
                      )}
                      <button
                        onClick={() => cancelPlan(plan.id)}
                        className="px-4 py-2 text-[13px] font-semibold border border-destructive text-destructive hover:bg-destructive/[0.08] transition-colors flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Cancel
                      </button>
                      <button
                        onClick={() =>
                          setSelectedPlanId(
                            selectedPlanId === plan.id ? null : plan.id
                          )
                        }
                        className="px-4 py-2 text-[13px] font-semibold border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors ml-auto flex items-center gap-1.5"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        History
                      </button>
                    </div>

                    {/* Execution History (inline) */}
                    {selectedPlanId === plan.id && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[13px] font-bold">
                            Execution History
                          </span>
                          <button
                            onClick={() => fetchExecutions(plan.id)}
                            className="text-[11px] text-primary hover:underline flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Refresh
                          </button>
                        </div>
                        {executions.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left">
                              <thead>
                                <tr className="border-b border-border">
                                  <th className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground p-2">
                                    Date
                                  </th>
                                  <th className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground p-2">
                                    Sent
                                  </th>
                                  <th className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground p-2">
                                    Received
                                  </th>
                                  <th className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground p-2">
                                    Rate
                                  </th>
                                  <th className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground p-2">
                                    Status
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {executions.map((exec) => (
                                  <tr
                                    key={exec.id}
                                    className="border-b border-border last:border-0"
                                  >
                                    <td className="p-2 text-[12px] text-muted-foreground">
                                      {formatDate(exec.executedAt)}
                                    </td>
                                    <td className="p-2 text-[13px] font-semibold">
                                      {exec.fromAmount.toLocaleString()}{" "}
                                      {plan.fromCurrency}
                                    </td>
                                    <td className="p-2 text-[13px] font-semibold text-success">
                                      {exec.toAmount.toLocaleString()}{" "}
                                      {plan.toCurrency}
                                    </td>
                                    <td className="p-2 text-[13px]">
                                      ${exec.rate.toLocaleString("en-US", { maximumFractionDigits: 4 })}
                                    </td>
                                    <td className="p-2">
                                      <span
                                        className={`inline-flex items-center px-2 py-0.5 text-[11px] font-bold uppercase ${
                                          exec.status === "COMPLETED"
                                            ? "bg-success/[0.08] text-success"
                                            : "bg-destructive/[0.08] text-destructive"
                                        }`}
                                      >
                                        {exec.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-[13px] text-muted-foreground text-center py-4">
                            No executions yet
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-card border border-border p-8 text-center">
                <Shield className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-[14px] font-semibold">
                  No active protection plans
                </p>
                <p className="text-[13px] text-muted-foreground mt-1">
                  Create your first plan to start protecting your money from
                  inflation.
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Create DCA Form */}
            <h2 className="text-[18px] font-bold">Start Protecting</h2>
            <div className="bg-card border border-border p-4">
              <div className="space-y-4">
                {/* From Currency */}
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground block mb-1.5">
                    From Currency
                  </label>
                  <select
                    value={fromCurrency}
                    onChange={(e) => setFromCurrency(e.target.value)}
                    className="w-full px-3 py-2.5 text-[13px] bg-background dark:bg-[#21262D] border border-border dark:border-[rgba(230,237,243,0.1)] text-foreground cursor-pointer focus:border-primary focus:outline-none"
                  >
                    {FROM_CURRENCIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.flag} {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* To Currency */}
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground block mb-1.5">
                    To Stablecoin
                  </label>
                  <select
                    value={toCurrency}
                    onChange={(e) => setToCurrency(e.target.value)}
                    className="w-full px-3 py-2.5 text-[13px] bg-background dark:bg-[#21262D] border border-border dark:border-[rgba(230,237,243,0.1)] text-foreground cursor-pointer focus:border-primary focus:outline-none"
                  >
                    {TO_CURRENCIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground block mb-1.5">
                    Amount per execution
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2.5 text-[13px] font-extrabold bg-background dark:bg-[#21262D] border border-border dark:border-[rgba(230,237,243,0.1)] text-foreground tabular-nums focus:border-primary focus:outline-none"
                  />
                </div>

                {/* Frequency */}
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground block mb-1.5">
                    Frequency
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {FREQUENCIES.map((f) => (
                      <button
                        key={f.value}
                        onClick={() => setFrequency(f.value)}
                        className={`p-2.5 text-left border-2 cursor-pointer transition-colors ${
                          frequency === f.value
                            ? "border-primary bg-primary/[0.08]"
                            : "border-border bg-card hover:border-primary/30"
                        }`}
                      >
                        <div className="text-[12px] font-bold">{f.label}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {f.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Create Button */}
                <button
                  onClick={handleCreate}
                  disabled={isCreating || !amount || parseFloat(amount) <= 0}
                  className="w-full py-3 text-[14px] font-extrabold bg-success text-white border-none cursor-pointer hover:bg-[#059669] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      Start Protecting
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Why Dollar Shield */}
            <div className="bg-card border border-border p-4">
              <h3 className="font-extrabold text-sm mb-4">
                Why Dollar Shield?
              </h3>
              <div className="flex flex-col gap-3 text-[13px]">
                {BENEFITS.map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <item.icon className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block text-[12px]">
                        {item.title}
                      </span>
                      <span className="text-muted-foreground text-[12px]">
                        {item.text}
                      </span>
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
