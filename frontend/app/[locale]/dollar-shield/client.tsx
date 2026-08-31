"use client";

import { useEffect, useState } from "react";
import {
  Shield,
  DollarSign,
  TrendingUp,
  Play,
  Pause,
  XCircle,
  Loader2,
  Clock,
  Zap,
  ArrowRight,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { useDcaStore, type DcaPlan } from "@/store/dca/dca-store";
import { useUserStore } from "@/store/user";
import { UserDashboardShell } from "@/components/layout/user-dashboard-shell";

/* ---- Constants ---- */

const FROM_CURRENCIES = [
  { value: "ARS", label: "Argentine Peso", flag: "\u{1F1E6}\u{1F1F7}" },
  { value: "BRL", label: "Brazilian Real", flag: "\u{1F1E7}\u{1F1F7}" },
  { value: "COP", label: "Colombian Peso", flag: "\u{1F1E8}\u{1F1F4}" },
  { value: "CLP", label: "Chilean Peso", flag: "\u{1F1E8}\u{1F1F1}" },
  { value: "PEN", label: "Peruvian Sol", flag: "\u{1F1F5}\u{1F1EA}" },
  { value: "MXN", label: "Mexican Peso", flag: "\u{1F1F2}\u{1F1FD}" },
];

const TO_STABLECOINS = [
  { value: "USDT", label: "Tether" },
  { value: "USDC", label: "USD Coin" },
  { value: "DAI", label: "Dai" },
];

const FREQUENCIES: { value: DcaPlan["frequency"]; label: string; shortLabel: string }[] = [
  { value: "DAILY", label: "Daily", shortLabel: "1D" },
  { value: "WEEKLY", label: "Weekly", shortLabel: "1W" },
  { value: "BIWEEKLY", label: "Biweekly", shortLabel: "2W" },
  { value: "MONTHLY", label: "Monthly", shortLabel: "1M" },
];

const BENEFITS = [
  {
    icon: Shield,
    title: "Inflation Protection",
    text: "Auto-convert before your currency loses value",
  },
  {
    icon: TrendingUp,
    title: "Dollar-Cost Averaging",
    text: "Smooth volatility with scheduled buys",
  },
  {
    icon: Zap,
    title: "Fully Automated",
    text: "Set once, conversions run on autopilot",
  },
  {
    icon: Clock,
    title: "Flexible Scheduling",
    text: "Daily, weekly, biweekly, or monthly",
  },
];

/* ---- Mock inflation data for the value meters ---- */
const LOCAL_DECLINE = [100, 96, 91, 87, 82, 78, 73, 69, 64, 60, 55, 51];
const STABLE_HOLD = [100, 100, 100, 99, 100, 100, 100, 99, 100, 100, 100, 100];
const MONTHS = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];

/* ---- Mock execution history ---- */
const MOCK_EXECUTIONS = [
  { id: "e1", date: "Aug 28, 2026", fromAmount: 15000, fromCurrency: "ARS", toAmount: 12.45, toCurrency: "USDT", rate: 0.00083 },
  { id: "e2", date: "Aug 21, 2026", fromAmount: 15000, fromCurrency: "ARS", toAmount: 12.38, toCurrency: "USDT", rate: 0.000825 },
  { id: "e3", date: "Aug 14, 2026", fromAmount: 15000, fromCurrency: "ARS", toAmount: 12.50, toCurrency: "USDT", rate: 0.000833 },
  { id: "e4", date: "Aug 7, 2026", fromAmount: 15000, fromCurrency: "ARS", toAmount: 12.61, toCurrency: "USDT", rate: 0.000841 },
  { id: "e5", date: "Jul 31, 2026", fromAmount: 15000, fromCurrency: "ARS", toAmount: 12.71, toCurrency: "USDT", rate: 0.000847 },
];

/* ---- Progress Ring component ---- */
function ProgressRing({ percent, status, size = 64 }: { percent: number; status: string; size?: number }) {
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  const strokeColor =
    status === "ACTIVE" ? "var(--success)" :
    status === "PAUSED" ? "var(--warning)" :
    "var(--muted-foreground)";

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-border"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="square"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.5s ease" }}
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-foreground"
        style={{ fontSize: "13px", fontWeight: 800 }}
      >
        {percent}%
      </text>
    </svg>
  );
}

/* ---- Main Component ---- */

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

  /* Create-plan wizard state */
  const [step, setStep] = useState(1);
  const [fromCurrency, setFromCurrency] = useState("");
  const [toCurrency, setToCurrency] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<DcaPlan["frequency"]>("WEEKLY");

  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchPlans();
    }
  }, [user]);

  useEffect(() => {
    if (expandedPlanId) {
      fetchExecutions(expandedPlanId);
    }
  }, [expandedPlanId]);

  const activePlans = plans.filter((p) => p.status !== "CANCELLED");

  const handleCreate = async () => {
    if (!amount || parseFloat(amount) <= 0 || !fromCurrency || !toCurrency) return;
    const result = await createPlan({
      fromCurrency,
      toCurrency,
      amount: parseFloat(amount),
      frequency,
    });
    if (result.success) {
      setAmount("");
      setStep(1);
      setFromCurrency("");
      setToCurrency("");
      fetchPlans();
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

  const executionData = executions.length > 0 ? executions : (expandedPlanId ? [] : []);

  return (
    <UserDashboardShell>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.02em]">
            Dollar Shield
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Protect your purchasing power — auto-convert local currency to stablecoins
          </p>
        </div>

        {/* ===== Hero: Value Meter Comparison ===== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-border bg-card overflow-hidden">
          {/* Local Currency - Declining */}
          <div className="p-6 border-b md:border-b-0 md:border-r border-border">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground">
                Local Currency (ARS)
              </span>
              <span className="text-[13px] font-extrabold text-destructive">
                -49%
              </span>
            </div>
            <p className="text-[12px] text-muted-foreground mb-4">
              Purchasing power over 12 months
            </p>
            <div className="flex items-end gap-[3px] h-[120px]">
              {LOCAL_DECLINE.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end gap-1">
                  <div
                    className="w-full transition-all duration-700 ease-out"
                    style={{
                      height: `${val}%`,
                      backgroundColor: `rgba(239, 68, 68, ${0.3 + (1 - val / 100) * 0.7})`,
                    }}
                  />
                  <span className="text-[8px] text-muted-foreground text-center block">
                    {MONTHS[i]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Stablecoin - Holding */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground">
                Stablecoin (USDT)
              </span>
              <span className="text-[13px] font-extrabold text-success">
                ~0%
              </span>
            </div>
            <p className="text-[12px] text-muted-foreground mb-4">
              Value retention over 12 months
            </p>
            <div className="flex items-end gap-[3px] h-[120px]">
              {STABLE_HOLD.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end gap-1">
                  <div
                    className="w-full transition-all duration-700 ease-out"
                    style={{
                      height: `${val}%`,
                      backgroundColor: `rgba(16, 185, 129, ${0.4 + (i / 11) * 0.3})`,
                    }}
                  />
                  <span className="text-[8px] text-muted-foreground text-center block">
                    {MONTHS[i]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===== Active DCA Plans ===== */}
        <div>
          <h2 className="text-[18px] font-extrabold mb-4">Active Plans</h2>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="bg-card border border-border p-6 animate-pulse">
                  <div className="h-5 bg-muted w-1/3 mb-3" />
                  <div className="h-4 bg-muted w-2/3" />
                </div>
              ))}
            </div>
          ) : activePlans.length > 0 ? (
            <div className="space-y-3">
              {activePlans.map((plan) => {
                // Calculate a pseudo completion percentage
                const maxExecutions = plan.frequency === "DAILY" ? 365 : plan.frequency === "WEEKLY" ? 52 : plan.frequency === "BIWEEKLY" ? 26 : 12;
                const completionPercent = Math.min(Math.round((plan.executionCount / maxExecutions) * 100), 100);

                return (
                  <div key={plan.id} className="bg-card border border-border">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-5">
                      {/* Progress ring */}
                      <ProgressRing
                        percent={completionPercent}
                        status={plan.status}
                      />

                      {/* Plan details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-[15px] font-extrabold">
                            {plan.fromCurrency} → {plan.toCurrency}
                          </h3>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em] ${
                              plan.status === "ACTIVE"
                                ? "bg-success/[0.08] text-success"
                                : "bg-warning/[0.08] text-warning"
                            }`}
                          >
                            {plan.status}
                          </span>
                        </div>
                        <p className="text-[12px] text-muted-foreground">
                          {plan.amount.toLocaleString()} {plan.fromCurrency} per{" "}
                          {plan.frequency.toLowerCase().replace("biweekly", "2 weeks")}
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                          <div>
                            <span className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground block">
                              Invested
                            </span>
                            <span className="text-[13px] font-bold tabular-nums">
                              ${plan.totalInvested.toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground block">
                              Received
                            </span>
                            <span className="text-[13px] font-bold text-success tabular-nums">
                              {plan.totalReceived.toLocaleString()} {plan.toCurrency}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground block">
                              Avg Rate
                            </span>
                            <span className="text-[13px] font-bold tabular-nums">
                              ${plan.averagePrice.toLocaleString("en-US", { maximumFractionDigits: 4 })}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground block">
                              Runs
                            </span>
                            <span className="text-[13px] font-bold tabular-nums">
                              {plan.executionCount}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons - stacked on right */}
                      <div className="flex sm:flex-col gap-2 shrink-0">
                        {plan.status === "ACTIVE" ? (
                          <button
                            onClick={() => pausePlan(plan.id)}
                            className="px-3 py-2 text-[12px] font-bold border border-border text-foreground hover:bg-muted/50 transition-colors flex items-center gap-1.5 cursor-pointer bg-transparent"
                          >
                            <Pause className="w-3.5 h-3.5" />
                            Pause
                          </button>
                        ) : (
                          <button
                            onClick={() => resumePlan(plan.id)}
                            className="px-3 py-2 text-[12px] font-bold border border-success text-success hover:bg-success/[0.08] transition-colors flex items-center gap-1.5 cursor-pointer bg-transparent"
                          >
                            <Play className="w-3.5 h-3.5" />
                            Resume
                          </button>
                        )}
                        <button
                          onClick={() => cancelPlan(plan.id)}
                          className="px-3 py-2 text-[12px] font-bold border border-destructive text-destructive hover:bg-destructive/[0.08] transition-colors flex items-center gap-1.5 cursor-pointer bg-transparent"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Cancel
                        </button>
                        <button
                          onClick={() =>
                            setExpandedPlanId(expandedPlanId === plan.id ? null : plan.id)
                          }
                          className="px-3 py-2 text-[12px] font-bold border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors flex items-center gap-1.5 cursor-pointer bg-transparent"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          History
                        </button>
                      </div>
                    </div>

                    {/* Inline execution timeline */}
                    {expandedPlanId === plan.id && (
                      <div className="border-t border-border px-5 py-4">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[13px] font-extrabold">Execution Timeline</span>
                          <button
                            onClick={() => fetchExecutions(plan.id)}
                            className="text-[11px] text-primary font-bold flex items-center gap-1 cursor-pointer bg-transparent border-none hover:underline"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Refresh
                          </button>
                        </div>

                        {/* Timeline */}
                        {(executionData.length > 0 ? executionData : MOCK_EXECUTIONS.map((e) => ({
                          ...e,
                          planId: plan.id,
                          status: "COMPLETED" as const,
                          executedAt: e.date,
                        }))).map((exec: any, idx: number, arr: any[]) => (
                          <div key={exec.id} className="flex gap-4">
                            {/* Timeline line + dot */}
                            <div className="flex flex-col items-center shrink-0 w-[20px]">
                              <div
                                className={`w-[10px] h-[10px] shrink-0 border-2 ${
                                  exec.status === "COMPLETED"
                                    ? "border-success bg-success/[0.3]"
                                    : "border-destructive bg-destructive/[0.3]"
                                }`}
                              />
                              {idx < arr.length - 1 && (
                                <div className="w-[1px] flex-1 min-h-[32px] bg-border" />
                              )}
                            </div>

                            {/* Content */}
                            <div className="pb-4 flex-1">
                              <div className="flex items-baseline justify-between">
                                <span className="text-[12px] text-muted-foreground">
                                  {typeof exec.executedAt === "string" && exec.executedAt.includes(",")
                                    ? exec.executedAt
                                    : formatDate(exec.executedAt)}
                                </span>
                                <span
                                  className={`text-[10px] font-bold uppercase ${
                                    exec.status === "COMPLETED"
                                      ? "text-success"
                                      : "text-destructive"
                                  }`}
                                >
                                  {exec.status}
                                </span>
                              </div>
                              <div className="flex items-baseline gap-2 mt-0.5">
                                <span className="text-[13px] font-bold tabular-nums">
                                  {(exec.fromAmount || 0).toLocaleString()} {plan.fromCurrency}
                                </span>
                                <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                                <span className="text-[13px] font-bold text-success tabular-nums">
                                  {(exec.toAmount || 0).toLocaleString()} {plan.toCurrency}
                                </span>
                                <span className="text-[11px] text-muted-foreground ml-auto">
                                  @ ${(exec.rate || 0).toLocaleString("en-US", { maximumFractionDigits: 6 })}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}

                        {executionData.length === 0 && !isLoading && (
                          <p className="text-[12px] text-muted-foreground text-center py-2">
                            Showing sample data
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-card border border-border p-8 text-center">
              <Shield className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-[14px] font-bold">No active plans yet</p>
              <p className="text-[13px] text-muted-foreground mt-1">
                Create your first plan below to start protecting your money.
              </p>
            </div>
          )}
        </div>

        {/* ===== Create New Plan - Step Flow ===== */}
        <div>
          <h2 className="text-[18px] font-extrabold mb-4">Create New Plan</h2>
          <div className="bg-card border border-border p-6">
            {/* Step indicators */}
            <div className="flex items-center gap-0 mb-8">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center flex-1">
                  <button
                    onClick={() => {
                      if (s === 1) setStep(1);
                      if (s === 2 && fromCurrency) setStep(2);
                      if (s === 3 && fromCurrency && toCurrency) setStep(3);
                    }}
                    className={`w-8 h-8 flex items-center justify-center text-[12px] font-extrabold shrink-0 cursor-pointer border-none transition-colors ${
                      step >= s
                        ? "bg-primary text-white"
                        : "bg-border text-muted-foreground"
                    }`}
                  >
                    {step > s ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      s
                    )}
                  </button>
                  {s < 3 && (
                    <div
                      className={`flex-1 h-[2px] mx-2 transition-colors ${
                        step > s ? "bg-primary" : "bg-border"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: Source currency */}
            {step === 1 && (
              <div>
                <span className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground block mb-3">
                  Step 1 — Source Currency
                </span>
                <p className="text-[13px] text-muted-foreground mb-4">
                  Choose the local currency you want to convert from
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {FROM_CURRENCIES.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => {
                        setFromCurrency(c.value);
                        setStep(2);
                      }}
                      className={`p-4 text-left border-2 cursor-pointer transition-colors bg-transparent ${
                        fromCurrency === c.value
                          ? "border-primary bg-primary/[0.08]"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <span className="text-[20px] block mb-1">{c.flag}</span>
                      <span className="text-[14px] font-extrabold block">{c.value}</span>
                      <span className="text-[11px] text-muted-foreground">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Target stablecoin */}
            {step === 2 && (
              <div>
                <span className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground block mb-3">
                  Step 2 — Target Stablecoin
                </span>
                <p className="text-[13px] text-muted-foreground mb-4">
                  Choose the stablecoin to protect your value in
                </p>
                <div className="grid grid-cols-3 gap-3 max-w-md">
                  {TO_STABLECOINS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => {
                        setToCurrency(c.value);
                        setStep(3);
                      }}
                      className={`p-4 text-center border-2 cursor-pointer transition-colors bg-transparent ${
                        toCurrency === c.value
                          ? "border-primary bg-primary/[0.08]"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <div className="w-10 h-10 mx-auto mb-2 flex items-center justify-center bg-success/[0.08] text-[11px] font-extrabold text-success">
                        {c.value.charAt(0)}$
                      </div>
                      <span className="text-[14px] font-extrabold block">{c.value}</span>
                      <span className="text-[11px] text-muted-foreground">{c.label}</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="mt-4 text-[12px] text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-none underline"
                >
                  Back to currency selection
                </button>
              </div>
            )}

            {/* Step 3: Amount + Frequency */}
            {step === 3 && (
              <div>
                <span className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground block mb-3">
                  Step 3 — Amount & Frequency
                </span>
                <p className="text-[13px] text-muted-foreground mb-4">
                  Converting{" "}
                  <span className="font-bold text-foreground">{fromCurrency}</span>
                  {" → "}
                  <span className="font-bold text-success">{toCurrency}</span>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground block mb-1.5">
                      Amount ({fromCurrency})
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-3 text-[16px] font-extrabold bg-background dark:bg-[#21262D] border border-border text-foreground tabular-nums focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground block mb-1.5">
                      Frequency
                    </label>
                    <div className="grid grid-cols-4 gap-1">
                      {FREQUENCIES.map((f) => (
                        <button
                          key={f.value}
                          onClick={() => setFrequency(f.value)}
                          className={`py-3 text-center cursor-pointer border-2 transition-colors bg-transparent ${
                            frequency === f.value
                              ? "border-primary bg-primary/[0.08]"
                              : "border-border hover:border-primary/30"
                          }`}
                        >
                          <span className="text-[13px] font-bold block">{f.shortLabel}</span>
                          <span className="text-[9px] text-muted-foreground">{f.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-6">
                  <button
                    onClick={() => setStep(2)}
                    className="px-5 py-3 text-[13px] font-bold border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer bg-transparent"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={isCreating || !amount || parseFloat(amount) <= 0}
                    className="px-6 py-3 text-[14px] font-extrabold bg-success text-white border-none cursor-pointer hover:bg-[#059669] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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
            )}
          </div>
        </div>

        {/* ===== Benefits strip ===== */}
        <div className="bg-card border border-border">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((item, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-5 ${
                  i < BENEFITS.length - 1 ? "border-b sm:border-b-0 sm:border-r border-border" : ""
                } ${i === 1 ? "lg:border-r" : ""}`}
              >
                <div className="w-9 h-9 flex items-center justify-center bg-success/[0.08] shrink-0">
                  <item.icon className="w-4 h-4 text-success" />
                </div>
                <div>
                  <span className="text-[12px] font-extrabold block">{item.title}</span>
                  <span className="text-[11px] text-muted-foreground leading-relaxed">
                    {item.text}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </UserDashboardShell>
  );
}
