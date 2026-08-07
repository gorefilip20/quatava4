"use client";

import { useEffect } from "react";
import {
  Bot,
  Sparkles,
  TrendingUp,
  Shield,
  Zap,
  Clock,
  DollarSign,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import {
  useAiInvestmentStore,
  type AiInvestment,
} from "@/store/ai/investment/use-ai-investment-store";
import { useUserStore } from "@/store/user";
import { UserDashboardShell } from "@/components/layout/user-dashboard-shell";
import AiInvestmentForm from "@/app/[locale]/trade/components/trading/ai-investment/index";

export default function AiInvestmentClient() {
  const { user } = useUserStore();
  const {
    investments,
    plans,
    isLoadingInvestments,
    isLoadingPlans,
    fetchInvestments,
    fetchPlans,
  } = useAiInvestmentStore();

  useEffect(() => {
    fetchPlans();
    if (user) {
      fetchInvestments();
    }
  }, [user]);

  const activeInvestments = investments.filter((i) => i.status === "ACTIVE");
  const completedInvestments = investments.filter(
    (i) => i.status === "COMPLETED"
  );
  const totalProfit = completedInvestments.reduce(
    (sum, i) => sum + (i.profit || 0),
    0
  );
  const totalInvested = activeInvestments.reduce(
    (sum, i) => sum + i.amount,
    0
  );

  return (
    <UserDashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-extrabold tracking-[-0.02em]">
              AI Investment
            </h1>
            <p className="text-[13px] text-muted-foreground mt-1">
              Automated trading strategies powered by machine learning
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-primary/[0.08]">
                <DollarSign className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                Total Invested
              </span>
            </div>
            <div className="text-[20px] font-extrabold">
              ${totalInvested.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-success/[0.08]">
                <TrendingUp className="w-4 h-4 text-success" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                Total Profit
              </span>
            </div>
            <div className="text-[20px] font-extrabold text-success">
              ${totalProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-primary/[0.08]">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                Active Bots
              </span>
            </div>
            <div className="text-[20px] font-extrabold">
              {activeInvestments.length}
            </div>
          </div>
          <div className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 flex items-center justify-center bg-primary/[0.08]">
                <BarChart3 className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold">
                Total Trades
              </span>
            </div>
            <div className="text-[20px] font-extrabold">
              {completedInvestments.length + activeInvestments.length}
            </div>
          </div>
        </div>

        {/* Main Content: Create + Active Investments */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* Active Investments */}
          <div className="space-y-4">
            <h2 className="text-[18px] font-bold">
              {activeInvestments.length > 0
                ? "Active Investments"
                : "Available Plans"}
            </h2>

            {isLoadingPlans || isLoadingInvestments ? (
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
            ) : activeInvestments.length > 0 ? (
              <div className="space-y-3">
                {activeInvestments.map((investment) => (
                  <InvestmentCard
                    key={investment.id}
                    investment={investment}
                    plans={plans}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className="bg-card border border-border p-5"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center bg-primary/[0.08]">
                          <Sparkles className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-[14px]">
                            {plan.title}
                          </h3>
                          {plan.description && (
                            <p className="text-[12px] text-muted-foreground mt-0.5">
                              {plan.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-bold uppercase bg-success/[0.08] text-success">
                        {plan.profitPercentage}% Return
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
                      <div>
                        <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block">
                          Min Investment
                        </span>
                        <span className="text-[13px] font-semibold">
                          ${plan.minAmount}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block">
                          Max Investment
                        </span>
                        <span className="text-[13px] font-semibold">
                          ${plan.maxAmount.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block">
                          Total Invested
                        </span>
                        <span className="text-[13px] font-semibold">
                          ${plan.invested?.toLocaleString() || "0"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {plans.length === 0 && (
                  <div className="bg-card border border-border p-8 text-center">
                    <Bot className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-[14px] font-semibold">
                      No AI investment plans available
                    </p>
                    <p className="text-[13px] text-muted-foreground mt-1">
                      Plans will appear here once configured by the admin.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Completed Investments */}
            {completedInvestments.length > 0 && (
              <div className="mt-6">
                <h2 className="text-[18px] font-bold mb-4">History</h2>
                <div className="bg-card border border-border overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground p-3">
                          Asset
                        </th>
                        <th className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground p-3">
                          Amount
                        </th>
                        <th className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground p-3">
                          Profit
                        </th>
                        <th className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground p-3">
                          Result
                        </th>
                        <th className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground p-3">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedInvestments.map((inv) => (
                        <tr
                          key={inv.id}
                          className="border-b border-border last:border-0"
                        >
                          <td className="p-3 text-[13px] font-semibold">
                            {inv.symbol}
                          </td>
                          <td className="p-3 text-[13px]">
                            ${inv.amount.toLocaleString()}
                          </td>
                          <td
                            className={`p-3 text-[13px] font-semibold ${
                              (inv.profit || 0) >= 0
                                ? "text-success"
                                : "text-destructive"
                            }`}
                          >
                            {(inv.profit || 0) >= 0 ? "+" : ""}$
                            {(inv.profit || 0).toLocaleString()}
                          </td>
                          <td className="p-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 text-[11px] font-bold uppercase ${
                                inv.result === "WIN"
                                  ? "bg-success/[0.08] text-success"
                                  : inv.result === "LOSS"
                                  ? "bg-destructive/[0.08] text-destructive"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {inv.result || "—"}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-bold uppercase bg-muted text-muted-foreground">
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: Create New Investment */}
          <div className="space-y-4">
            <h2 className="text-[18px] font-bold">Start Investing</h2>
            <div className="bg-card border border-border p-4">
              <AiInvestmentForm symbol="BTCUSDT" />
            </div>

            {/* Why AI Investment */}
            <div className="bg-card border border-border p-4">
              <h3 className="font-extrabold text-sm mb-4">
                Why AI Investment?
              </h3>
              <div className="flex flex-col gap-3 text-[13px]">
                {[
                  {
                    icon: Zap,
                    text: "Automated strategies run 24/7",
                  },
                  {
                    icon: Shield,
                    text: "Risk-managed with stop-loss protection",
                  },
                  {
                    icon: TrendingUp,
                    text: "ML-powered market analysis",
                  },
                  {
                    icon: Clock,
                    text: "No manual trading required",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <item.icon className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <span>{item.text}</span>
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

function InvestmentCard({
  investment,
  plans,
}: {
  investment: AiInvestment;
  plans: { id: string; title: string; profitPercentage: number }[];
}) {
  const plan = plans.find((p) => p.id === investment.planId);
  const { cancelInvestment } = useAiInvestmentStore();

  return (
    <div className="bg-card border border-border p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center bg-primary/[0.08]">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-[14px]">
              {plan?.title || "AI Bot"}
            </h3>
            <p className="text-[12px] text-muted-foreground">
              {investment.symbol} · {investment.type}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-bold uppercase bg-success/[0.08] text-success">
          Active
        </span>
      </div>
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
        <div>
          <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block">
            Invested
          </span>
          <span className="text-[13px] font-semibold">
            ${investment.amount.toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block">
            Profit
          </span>
          <span className="text-[13px] font-semibold text-success">
            ${(investment.profit || 0).toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-bold block">
            Expected Return
          </span>
          <span className="text-[13px] font-semibold">
            {plan?.profitPercentage || 0}%
          </span>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-border flex gap-2">
        <button
          onClick={() => cancelInvestment(investment.id)}
          className="px-4 py-2 text-[13px] font-semibold border border-destructive text-destructive hover:bg-destructive/[0.08] transition-colors"
        >
          Stop Bot
        </button>
      </div>
    </div>
  );
}
