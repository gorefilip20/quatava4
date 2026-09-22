"use client";

import { Link } from "@/i18n/routing";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeDollarSign,
  Banknote,
  Building2,
  CheckCircle2,
  ChevronDown,
  Globe2,
  Headphones,
  Languages,
  LineChart,
  ShieldCheck,
  Smartphone,
  Sparkles,
  WalletCards,
} from "lucide-react";

const regions = [
  { code: "BR", name: "Brazil", currency: "BRL", rail: "Pix-ready flow" },
  { code: "AR", name: "Argentina", currency: "ARS", rail: "Local transfer flow" },
  { code: "CO", name: "Colombia", currency: "COP", rail: "Local transfer flow" },
  { code: "CL", name: "Chile", currency: "CLP", rail: "Local transfer flow" },
  { code: "PE", name: "Peru", currency: "PEN", rail: "Local transfer flow" },
];

const capabilities = [
  {
    phase: "01",
    title: "A wallet that speaks your market",
    description: "Track fiat and digital assets together, with transparent balances, conversion, and transaction history.",
    href: "/finance/wallet",
    icon: WalletCards,
    tone: "bg-[#eaf3fb] text-[#2876b3]",
    status: "Available in the web app",
  },
  {
    phase: "01",
    title: "Regional money movement",
    description: "Start a quote-led transfer, save recipients, and follow every status change from one place.",
    href: "/send-money",
    icon: Banknote,
    tone: "bg-[#eefbf6] text-[#047857]",
    status: "Quote flow available",
  },
  {
    phase: "02",
    title: "Markets with a calmer workflow",
    description: "Explore markets, open paper mode first, and graduate to an authenticated trading flow when ready.",
    href: "/market",
    icon: LineChart,
    tone: "bg-[#f2efff] text-[#6d4aff]",
    status: "Market terminal available",
  },
  {
    phase: "02",
    title: "Research before action",
    description: "Use AI-assisted explanations and portfolio context without presenting forecasts as guarantees.",
    href: "/ai/trading",
    icon: Sparkles,
    tone: "bg-[#fff7e8] text-[#b56b00]",
    status: "Research surface available",
  },
  {
    phase: "03",
    title: "One account across screens",
    description: "The responsive web app is installable on mobile and keeps the same wallet, alerts, and support context.",
    href: "/dashboard",
    icon: Smartphone,
    tone: "bg-[#eef2ff] text-[#4355b9]",
    status: "Mobile web ready",
  },
  {
    phase: "04",
    title: "Human support when money is moving",
    description: "Open a ticket, start chat, and get clear escalation when verification or a transfer needs attention.",
    href: "/support",
    icon: Headphones,
    tone: "bg-[#fff0f2] text-[#c33b55]",
    status: "Support centre available",
  },
];

export default function PlatformHubPage() {
  const [selectedRegion, setSelectedRegion] = useState("BR");
  const region = useMemo(
    () => regions.find((item) => item.code === selectedRegion) || regions[0],
    [selectedRegion]
  );

  return (
    <main className="min-h-screen bg-[#f7f9fb] text-[#182536]">
      <div className="mx-auto max-w-[1180px] space-y-8 px-5 py-10 sm:px-8 lg:py-14">
        <section className="relative overflow-hidden rounded-[24px] border border-[#dce7ee] bg-[radial-gradient(circle_at_88%_10%,rgba(40,118,179,0.16),transparent_32%),linear-gradient(135deg,#ffffff,#eef8ff)] p-6 sm:p-10">
          <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full border border-[#2876b3]/10" />
          <div className="relative max-w-3xl">
            <div className="mb-4 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#2876b3]"><Globe2 className="h-3.5 w-3.5" /> South America first</div>
            <h1 className="max-w-2xl text-3xl font-bold tracking-[-0.04em] text-[#182536] sm:text-5xl">A clearer way to move, manage, and understand money.</h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-[#627184] sm:text-base">Quatava brings local-currency context, digital assets, markets, regional transfers, and human support into one calm terminal for web and mobile.</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#2876b3] px-5 text-xs font-bold text-white hover:bg-[#23699f]">Create your account <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/market" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#dce3ea] bg-white px-5 text-xs font-bold text-[#354154] hover:bg-[#fbfdff]">Explore markets</Link>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#dfe5ec] bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#2876b3]"><Languages className="h-3.5 w-3.5" /> Local context</div><h2 className="mt-2 text-xl font-bold text-[#263548]">Start where your money lives</h2><p className="mt-1 text-xs text-[#7a8696]">Choose a market to see the currency and rail context we are prioritizing.</p></div>
            <div className="relative w-full sm:w-64"><select aria-label="Choose regional market" value={selectedRegion} onChange={(event) => setSelectedRegion(event.target.value)} className="h-11 w-full appearance-none rounded-xl border border-[#dce3ea] bg-[#fbfdff] px-4 pr-10 text-sm font-semibold text-[#354154] outline-none focus:border-[#2876b3]">{regions.map((item) => <option key={item.code} value={item.code}>{item.name} · {item.currency}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7a8696]" /></div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-[#f7f9fb] p-4"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8b96a4]">Selected market</p><p className="mt-2 text-lg font-bold text-[#263548]">{region.name}</p></div><div className="rounded-xl bg-[#f7f9fb] p-4"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8b96a4]">Primary currency</p><p className="mt-2 text-lg font-bold text-[#263548]">{region.currency}</p></div><div className="rounded-xl bg-[#f7f9fb] p-4"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8b96a4]">Current path</p><p className="mt-2 text-sm font-bold text-[#263548]">{region.rail}</p></div></div>
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between gap-3"><div><div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#2876b3]">The platform</div><h2 className="mt-2 text-2xl font-bold tracking-tight text-[#263548]">Everything important, connected.</h2></div><Link href="/dashboard" className="hidden text-xs font-bold text-[#2876b3] sm:inline-flex sm:items-center sm:gap-1">Open hub <ArrowRight className="h-3.5 w-3.5" /></Link></div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{capabilities.map((item) => { const Icon = item.icon; return <Link key={item.title} href={item.href} className="group rounded-2xl border border-[#dfe5ec] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#9fc8e5] hover:shadow-[0_12px_28px_rgba(31,74,112,0.08)]"><div className="flex items-start justify-between gap-3"><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.tone}`}><Icon className="h-5 w-5" /></div><span className="text-[10px] font-black tracking-[0.12em] text-[#9aa4b1]">{item.phase}</span></div><h3 className="mt-6 text-base font-bold text-[#263548]">{item.title}</h3><p className="mt-2 text-xs leading-6 text-[#7a8696]">{item.description}</p><div className="mt-5 flex items-center justify-between border-t border-[#edf0f4] pt-4"><span className="flex items-center gap-1.5 text-[10px] font-semibold text-[#68778a]"><CheckCircle2 className="h-3.5 w-3.5 text-[#16a05d]" /> {item.status}</span><ArrowRight className="h-4 w-4 text-[#9aa4b1] transition group-hover:translate-x-1 group-hover:text-[#2876b3]" /></div></Link> })}</div>
        </section>

        <section className="grid gap-4 md:grid-cols-3"><div className="rounded-2xl border border-[#dfe5ec] bg-white p-5"><ShieldCheck className="h-5 w-5 text-[#16a05d]" /><h3 className="mt-4 text-sm font-bold text-[#263548]">Trust before scale</h3><p className="mt-2 text-xs leading-6 text-[#7a8696]">Transparent fees, verification status, and visible support are part of the product—not hidden settings.</p></div><div className="rounded-2xl border border-[#dfe5ec] bg-white p-5"><Building2 className="h-5 w-5 text-[#2876b3]" /><h3 className="mt-4 text-sm font-bold text-[#263548]">Built for people and businesses</h3><p className="mt-2 text-xs leading-6 text-[#7a8696]">The same foundation can support personal wallets, merchant flows, and future business accounts.</p></div><div className="rounded-2xl border border-[#dfe5ec] bg-white p-5"><BadgeDollarSign className="h-5 w-5 text-[#b56b00]" /><h3 className="mt-4 text-sm font-bold text-[#263548]">No hidden promises</h3><p className="mt-2 text-xs leading-6 text-[#7a8696]">Quatava can help users understand options, but never promises returns or removes market risk.</p></div></section>
      </div>
    </main>
  );
}
