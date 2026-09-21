"use client";

import { useEffect, useMemo, useState } from "react";
import { Bot, Grid3X3, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { useAiInvestmentStore } from "@/store/ai/investment/use-ai-investment-store";

const icons = [Sparkles, Grid3X3, Bot];
const subtitles = ["Trend Following", "Range Trading", "Dollar Cost Average"];

export default function AITradingPage() {
  const { plans, investments, isLoadingPlans, isLoadingInvestments, apiError, fetchPlans, fetchInvestments } = useAiInvestmentStore();
  const [notice, setNotice] = useState("");

  useEffect(() => {
    void Promise.all([fetchPlans(), fetchInvestments()]);
  }, [fetchPlans, fetchInvestments]);

  const activeInvestments = investments.filter((investment) => investment.status === "ACTIVE");
  const totalCapital = investments.reduce((sum, investment) => sum + Number(investment.amount || 0), 0);
  const totalProfit = investments.reduce((sum, investment) => sum + Number(investment.profit || 0), 0);
  const cards = useMemo(() => plans.slice(0, 3), [plans]);
  const loading = isLoadingPlans || isLoadingInvestments;

  return (
    <div className="mx-auto max-w-[1180px] space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div><div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#2c78b6]"><Bot className="h-3.5 w-3.5" />AI Trading</div><h1 className="text-2xl font-bold tracking-tight text-[#182536]">AI Trading</h1><p className="mt-1 text-xs text-[#7a8696]">Automated strategies powered by Quatava investment plans.</p></div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] font-semibold text-amber-700"><ShieldCheck className="h-3.5 w-3.5" /> Backend-controlled execution</span>
      </div>
      <div className="flex items-center justify-between rounded-md border border-[#dfe5ec] bg-white px-4 py-3 text-[11px] text-[#667487]"><span>{loading ? "Refreshing strategy data…" : apiError ? "Strategy data is unavailable." : "Strategy data is synced with your account."}</span><button type="button" onClick={() => void Promise.all([fetchPlans(), fetchInvestments()])} className="inline-flex items-center gap-1.5 rounded border border-[#dbe2e9] px-3 py-1.5 text-[10px] font-semibold text-[#536173] hover:bg-[#f8fafc]"><RefreshCw className="h-3 w-3" />Refresh</button></div>
      {apiError && <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-[11px] text-rose-700">{apiError} No strategy values are shown until the backend responds.</p>}
      {notice && <p role="status" className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-[11px] text-blue-800">{notice}</p>}

      <section className="grid gap-4 lg:grid-cols-3">
        {(cards.length ? cards : [null, null, null]).map((plan, index) => { const Icon = icons[index]; return <article key={plan?.id || index} className="rounded-md border border-[#dfe5ec] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"><div className="flex items-start justify-between"><div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#edf5fb] text-[#2876b3]"><Icon className="h-4 w-4" /></div><div><h2 className="text-sm font-semibold text-[#233044]">{plan?.title || ["Momentum Bot", "Grid Bot", "DCA Bot"][index]}</h2><p className="text-[10px] text-[#8b96a4]">{plan?.description || subtitles[index]}</p></div></div><span className={`rounded-full px-2 py-1 text-[9px] font-bold ${plan?.status === false ? "bg-[#eef1f5] text-[#7b8795]" : plan ? "bg-[#e4f7ed] text-[#1c9a5b]" : "bg-amber-50 text-amber-700"}`}>{plan ? (plan.status === false ? "PAUSED" : "AVAILABLE") : "UNAVAILABLE"}</span></div><div className="mt-5 grid grid-cols-2 gap-y-4 text-[10px] text-[#8792a0]"><div><p>EXPECTED RETURN</p><strong className="mt-1 block text-sm text-[#16a05d]">{plan ? `${plan.profitPercentage}%` : "—"}</strong></div><div><p>MINIMUM</p><strong className="mt-1 block text-sm text-[#344054]">{plan ? plan.minAmount.toLocaleString() : "—"}</strong></div><div><p>ACTIVE PLANS</p><strong className="mt-1 block text-sm text-[#344054]">{plan ? activeInvestments.filter((investment) => investment.planId === plan.id).length : "—"}</strong></div><div><p>DURATIONS</p><strong className="mt-1 block text-sm text-[#344054]">{plan?.durations?.length ?? "—"}</strong></div></div><button type="button" disabled={!plan} onClick={() => setNotice(`${plan?.title} is configured through the investment workflow. Choose a duration and amount there to create an allocation.`)} className="mt-5 inline-flex w-full items-center justify-center rounded-md border border-[#dbe2e9] px-3 py-2 text-[10px] font-semibold text-[#536173] disabled:cursor-not-allowed disabled:opacity-50">View strategy details</button></article>; })}
      </section>

      <section className="rounded-md border border-[#dfe5ec] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]"><div className="flex items-center justify-between border-b border-[#edf0f4] px-5 py-4"><h2 className="text-sm font-semibold text-[#263548]">AI Performance Summary</h2><span className="text-[10px] text-[#8b96a4]">Account data</span></div><div className="grid gap-5 p-5 sm:grid-cols-3"><div><p className="text-[10px] text-[#8994a0]">TOTAL PROFIT</p><p className="mt-1 text-xl font-bold text-[#344054]">{investments.length ? totalProfit.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}</p></div><div><p className="text-[10px] text-[#8994a0]">ACTIVE STRATEGIES</p><p className="mt-1 text-xl font-bold text-[#344054]">{investments.length ? activeInvestments.length : "—"}</p></div><div><p className="text-[10px] text-[#8994a0]">CAPITAL DEPLOYED</p><p className="mt-1 text-xl font-bold text-[#344054]">{investments.length ? totalCapital.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}</p></div></div></section>
      <p className="text-[10px] text-[#8b96a4]">AI strategy cards never invent returns or balances. Values appear only after the authenticated investment APIs return account data.</p>
    </div>
  );
}
