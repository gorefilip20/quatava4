"use client";

import Link from "next/link";
import { useState } from "react";
import { Bot, Grid3X3, Pause, Play, Settings2, ShieldCheck, Sparkles } from "lucide-react";

const initialBots = [
  { name: "Momentum Bot", subtitle: "Trend Following", icon: Sparkles, status: "RUNNING", returnValue: "+14.2%", allocated: "$5,000", winRate: "68%", trades: "142", tone: "blue" },
  { name: "Grid Bot", subtitle: "Range Trading", icon: Grid3X3, status: "RUNNING", returnValue: "+8.7%", allocated: "$3,000", winRate: "74%", trades: "286", tone: "blue" },
  { name: "DCA Bot", subtitle: "Dollar Cost Average", icon: Bot, status: "PAUSED", returnValue: "+5.3%", allocated: "$2,000", winRate: "—", trades: "—", tone: "slate" },
];

export default function AITradingPage() {
  const [bots, setBots] = useState(initialBots);
  const [notice, setNotice] = useState("AI strategies are running in paper mode. No real funds are used.");

  const toggleBot = (name: string) => {
    setBots((current) => current.map((bot) => bot.name === name ? { ...bot, status: bot.status === "RUNNING" ? "PAUSED" : "RUNNING" } : bot));
    setNotice(`${name} status updated locally in paper mode.`);
  };

  return (
    <div className="mx-auto max-w-[1180px] space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div><div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#2c78b6]"><Bot className="h-3.5 w-3.5" />AI Trading</div><h1 className="text-2xl font-bold tracking-tight text-[#182536]">AI Trading</h1><p className="mt-1 text-xs text-[#7a8696]">Automated trading strategies powered by machine learning.</p></div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] font-semibold text-amber-700"><ShieldCheck className="h-3.5 w-3.5" /> Paper mode</span>
      </div>
      <div role="status" className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-[11px] text-amber-800">{notice}</div>

      <section className="grid gap-4 lg:grid-cols-3">
        {bots.map((bot) => { const Icon = bot.icon; const running = bot.status === "RUNNING"; return <article key={bot.name} className="rounded-md border border-[#dfe5ec] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"><div className="flex items-start justify-between"><div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#edf5fb] text-[#2876b3]"><Icon className="h-4 w-4" /></div><div><h2 className="text-sm font-semibold text-[#233044]">{bot.name}</h2><p className="text-[10px] text-[#8b96a4]">{bot.subtitle}</p></div></div><span className={`rounded-full px-2 py-1 text-[9px] font-bold ${running ? "bg-[#e4f7ed] text-[#1c9a5b]" : "bg-[#eef1f5] text-[#7b8795]"}`}>{bot.status}</span></div><div className="mt-5 grid grid-cols-2 gap-y-4 text-[10px] text-[#8792a0]"><div><p>30D RETURN</p><strong className="mt-1 block text-sm text-[#16a05d]">{bot.returnValue}</strong></div><div><p>ALLOCATED</p><strong className="mt-1 block text-sm text-[#344054]">{bot.allocated}</strong></div><div><p>WIN RATE</p><strong className="mt-1 block text-sm text-[#344054]">{bot.winRate}</strong></div><div><p>TRADES</p><strong className="mt-1 block text-sm text-[#344054]">{bot.trades}</strong></div></div><div className="mt-5 flex gap-2"><button type="button" onClick={() => setNotice(`${bot.name} configuration is available after the paper profile is saved.`)} className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-[#dbe2e9] px-3 py-2 text-[10px] font-medium text-[#536173]"><Settings2 className="h-3 w-3" />Configure</button><button type="button" onClick={() => toggleBot(bot.name)} className={`inline-flex flex-1 items-center justify-center gap-1 rounded-md px-3 py-2 text-[10px] font-semibold text-white ${running ? "bg-[#dc3434]" : "bg-[#2d78b7]"}`}>{running ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}{running ? "Stop" : "Resume Bot"}</button></div></article>; })}
      </section>

      <section className="rounded-md border border-[#dfe5ec] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]"><div className="flex items-center justify-between border-b border-[#edf0f4] px-5 py-4"><h2 className="text-sm font-semibold text-[#263548]">AI Performance Summary</h2><span className="text-[10px] text-[#8b96a4]">Last 30 days · simulated</span></div><div className="grid gap-5 p-5 sm:grid-cols-3"><div><p className="text-[10px] text-[#8994a2]">TOTAL RETURN</p><p className="mt-1 text-xl font-bold text-[#159a59]">+9.4%</p></div><div><p className="text-[10px] text-[#8994a2]">ACTIVE STRATEGIES</p><p className="mt-1 text-xl font-bold text-[#263548]">{bots.filter((bot) => bot.status === "RUNNING").length}</p></div><div><p className="text-[10px] text-[#8994a2]">CAPITAL DEPLOYED</p><p className="mt-1 text-xl font-bold text-[#263548]">$8,000</p></div></div></section>
      <Link href="/en/trade" className="inline-flex text-[11px] font-semibold text-[#2876b3]">Review paper orders →</Link>
    </div>
  );
}
