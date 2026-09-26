"use client";

import { Link } from "@/i18n/routing";
import { ArrowRight, LockKeyhole, ShieldCheck, TrendingUp, WalletCards } from "lucide-react";

const pools = [
  { name: "USDT Flexible", asset: "USDT", apr: "6.40%", term: "Flexible", tone: "bg-[#eaf3fb] text-[#2876b3]" },
  { name: "BTC Core", asset: "BTC", apr: "3.20%", term: "30 days", tone: "bg-[#fff7e8] text-[#a86d1c]" },
  { name: "ETH Network", asset: "ETH", apr: "4.80%", term: "Flexible", tone: "bg-[#f0efff] text-[#635cb0]" },
];

export default function StakingLanding() {
  return (
    <div className="mx-auto max-w-[1180px] space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#2876b3]">
            <TrendingUp className="h-3.5 w-3.5" /> Earn
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#182536]">Staking</h1>
          <p className="mt-1 text-xs text-[#7a8696]">Put your digital assets to work with transparent terms and flexible access.</p>
        </div>
        <Link href="/staking/pool" className="inline-flex h-9 w-fit items-center gap-2 rounded-md bg-[#2876b3] px-4 text-[11px] font-bold text-white transition hover:bg-[#1f659b]">
          Explore pools <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total staked", "—", "Connect wallet data to load"],
          ["Estimated rewards", "—", "Calculated from active positions"],
          ["Average APR", "—", "Provider-backed rates"],
          ["Active positions", "—", "Your positions appear here"],
        ].map(([label, value, caption]) => (
          <article key={label} className="rounded-md border border-[#dfe5ec] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <p className="text-[9px] font-semibold tracking-[0.08em] text-[#8b96a4]">{label.toUpperCase()}</p>
            <p className="mt-2 text-xl font-bold text-[#253348]">{value}</p>
            <p className="mt-1 text-[10px] font-semibold text-[#7c8795]">{caption}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <article className="rounded-md border border-[#dfe5ec] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="flex items-center justify-between border-b border-[#edf0f4] px-5 py-4">
            <div><h2 className="text-sm font-semibold text-[#263548]">Available pools</h2><p className="mt-1 text-[10px] text-[#8b96a4]">Preview current products before connecting your wallet.</p></div>
            <WalletCards className="h-4 w-4 text-[#2876b3]" />
          </div>
          <div className="divide-y divide-[#f0f2f5]">
            {pools.map((pool) => (
              <div key={pool.name} className="flex items-center gap-3 px-5 py-4">
                <span className={`flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold ${pool.tone}`}>{pool.asset[0]}</span>
                <div className="min-w-0 flex-1"><p className="text-xs font-semibold text-[#354154]">{pool.name}</p><p className="mt-1 text-[10px] text-[#8b96a4]">{pool.term} term · provider rate preview</p></div>
                <div className="text-right"><p className="text-xs font-bold text-[#2876b3]">{pool.apr}</p><p className="mt-1 text-[10px] text-[#8b96a4]">est. APR</p></div>
              </div>
            ))}
          </div>
          <div className="border-t border-[#edf0f4] px-5 py-4"><Link href="/staking/pool" className="text-[11px] font-bold text-[#2876b3]">View all pools →</Link></div>
        </article>

        <article className="rounded-md border border-[#dfe5ec] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#2876b3]" /><h2 className="text-sm font-semibold text-[#263548]">How staking works</h2></div>
          <div className="mt-5 space-y-4">
            {["Choose a pool and review its term", "Confirm the amount from your wallet", "Track rewards and withdraw when eligible"].map((step, index) => (
              <div key={step} className="flex items-start gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#eaf3fb] text-[10px] font-bold text-[#2876b3]">{index + 1}</span><p className="pt-1 text-xs text-[#566477]">{step}</p></div>
            ))}
          </div>
          <div className="mt-6 flex items-start gap-2 rounded-md border border-[#e5eaf0] bg-[#f7f9fb] p-3 text-[10px] leading-5 text-[#667487]"><LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2876b3]" />Rates and availability are provider-controlled. No funds move in preview mode.</div>
        </article>
      </section>

      <p className="text-[10px] text-[#8b96a4]">Staking involves market, liquidity, provider, and smart-contract risks. Review terms before confirming an eligible position.</p>
    </div>
  );
}
