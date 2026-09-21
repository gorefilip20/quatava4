"use client";

import { useState } from "react";
import { CreditCard, Copy, LockKeyhole, MoreHorizontal, Pencil, ShoppingBag, Snowflake, WalletCards } from "lucide-react";

const transactions = [
  { merchant: "Pão de Açúcar", category: "Groceries · Today, 14:20", amount: "-R$142.30", icon: ShoppingBag, tone: "text-[#c94a52]" },
  { merchant: "Card top-up from USDT", category: "Yesterday, 09:04", amount: "+R$1,000.00", icon: WalletCards, tone: "text-[#1c9a5b]" },
  { merchant: "99 (ride share)", category: "Transport · Aug 28, 18:52", amount: "-R$28.90", icon: CreditCard, tone: "text-[#c94a52]" },
  { merchant: "Outback Steakhouse", category: "Dining · Aug 27, 20:15", amount: "-R$186.00", icon: Pencil, tone: "text-[#c94a52]" },
];

export default function CardPage() {
  const [frozen, setFrozen] = useState(false);
  return (
    <div className="mx-auto max-w-[1180px] space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div><div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#2876b3]"><CreditCard className="h-3.5 w-3.5" /> Payments</div><h1 className="text-2xl font-bold tracking-tight text-[#182536]">Quatava Card</h1><p className="mt-1 text-xs text-[#7a8696]">Spend your crypto anywhere — instantly converted, no borders.</p></div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-semibold text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Virtual card active</span>
      </div>
      <section className="grid gap-5 lg:grid-cols-[1.22fr_0.78fr]">
        <article className="rounded-md border border-[#dfe5ec] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="flex items-center justify-between"><span className="text-xs font-semibold text-[#354154]">Your virtual card</span><button className="rounded-md p-1.5 text-[#8b96a4] hover:bg-[#f4f7fa]" aria-label="More card options"><MoreHorizontal className="h-4 w-4" /></button></div>
          <div className={`relative mt-4 min-h-[235px] overflow-hidden rounded-xl p-6 text-white shadow-[0_18px_36px_rgba(35,82,125,0.22)] transition ${frozen ? "bg-[#6b7785]" : "bg-[linear-gradient(120deg,#1e446c,#327fbb_55%,#183957)]"}`}>
            <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full border border-white/10" /><div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full border border-white/10" />
            <div className="relative flex items-start justify-between"><div className="flex items-center gap-2 text-sm font-bold"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15"><WalletCards className="h-4 w-4" /></span>Quatava</div><div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/75">{frozen ? "Frozen" : "Virtual"} Card</div></div>
            <div className="relative mt-14 flex items-center gap-3 font-mono text-xl tracking-[0.17em] sm:text-2xl">5312 <span className="text-white/70">•••• ••••</span> 4471 <Copy className="ml-1 h-3.5 w-3.5 text-white/60" /></div>
            <div className="relative mt-7 flex items-end justify-between text-[9px] uppercase tracking-[0.12em] text-white/70"><div><div>Card holder</div><strong className="mt-1 block text-xs tracking-normal text-white">MARCO RODRIGUEZ</strong></div><div><div>Expires</div><strong className="mt-1 block text-xs tracking-normal text-white">09/29</strong></div></div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3"><button onClick={() => setFrozen(!frozen)} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#2876b3] text-xs font-bold text-white transition hover:bg-[#1f659b]"><Snowflake className="h-3.5 w-3.5" />{frozen ? "Unfreeze card" : "Freeze card"}</button><button className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#dfe5ec] bg-white text-xs font-bold text-[#354154] hover:bg-[#f7f9fb]"><LockKeyhole className="h-3.5 w-3.5" />Card settings</button></div>
        </article>
        <article className="rounded-md border border-[#dfe5ec] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]"><div className="flex items-center justify-between border-b border-[#edf0f4] px-5 py-4"><div><h2 className="text-sm font-semibold text-[#263548]">Card balance</h2><p className="mt-1 text-[10px] text-[#8b96a4]">Available to spend</p></div><span className="text-xl font-bold text-[#182536]">R$3,240.80</span></div><div className="divide-y divide-[#f0f2f5]">{transactions.map((item) => { const Icon = item.icon; return <div key={item.merchant} className="flex items-center gap-3 px-5 py-4"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f3f6f9] text-[#708095]"><Icon className="h-3.5 w-3.5" /></div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-[#354154]">{item.merchant}</p><p className="mt-1 text-[10px] text-[#8b96a4]">{item.category}</p></div><strong className={`text-xs ${item.tone}`}>{item.amount}</strong></div>; })}</div><div className="border-t border-[#edf0f4] px-5 py-4"><button className="text-[11px] font-bold text-[#2876b3] hover:text-[#1d5f91]">View all transactions →</button></div></article>
      </section>
      <p className="text-[10px] text-[#8b96a4]">Virtual card preview. Card issuance, conversion, and settlement depend on country availability and approved payment partners.</p>
    </div>
  );
}
