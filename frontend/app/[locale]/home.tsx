"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bitcoin,
  ChevronRight,
  CircleDollarSign,
  Globe2,
  Layers3,
  LockKeyhole,
  Menu,
  Play,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "@/i18n/routing";
import { tickersWs } from "@/services/tickers-ws";
import { useUserStore } from "@/store/user";
import { useConfigStore } from "@/store/config";
import { cn } from "@/lib/utils";

type Market = {
  currency: string;
  pair: string;
  name: string;
  price: number;
  change: number;
  volume: number;
  marketCap: number;
  color: string;
};

type ApiMarket = {
  currency?: string;
  pair?: string;
  name?: string;
  marketCap?: number;
};

const fallbackMarkets: Market[] = [
  { currency: "BTC", pair: "USDT", name: "Bitcoin", price: 109482.18, change: 2.84, volume: 42.8e9, marketCap: 2.17e12, color: "#f7931a" },
  { currency: "ETH", pair: "USDT", name: "Ethereum", price: 4028.64, change: 1.96, volume: 18.4e9, marketCap: 485.5e9, color: "#627eea" },
  { currency: "SOL", pair: "USDT", name: "Solana", price: 248.12, change: 5.42, volume: 6.8e9, marketCap: 118.2e9, color: "#14f195" },
  { currency: "BNB", pair: "USDT", name: "BNB", price: 712.38, change: -0.74, volume: 2.9e9, marketCap: 105.2e9, color: "#f3ba2f" },
  { currency: "XRP", pair: "USDT", name: "XRP", price: 2.31, change: 3.18, volume: 2.2e9, marketCap: 134.7e9, color: "#6b7280" },
  { currency: "QTAVA", pair: "USDT", name: "Quatava", price: 0.0842, change: 8.61, volume: 142.6e6, marketCap: 84.2e6, color: "#8b5cf6" },
];

const navItems = [
  { label: "Markets", href: "/market" },
  { label: "Trade", href: "/trade" },
  { label: "Earn", href: "/staking" },
  { label: "P2P", href: "/p2p" },
];

const formatPrice = (value: number) => {
  if (value >= 1000) return `$${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  if (value >= 1) return `$${value.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: 4, minimumFractionDigits: 4 })}`;
};

const formatCompact = (value: number) => {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  return `$${(value / 1e3).toFixed(0)}K`;
};

function Sparkline({ positive = true, compact = false }: { positive?: boolean; compact?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 160 48"
      className={cn("w-full", compact ? "h-8" : "h-14")}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={positive ? "spark-green" : "spark-red"} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={positive ? "#047857" : "#fb7185"} stopOpacity="0.34" />
          <stop offset="100%" stopColor={positive ? "#047857" : "#fb7185"} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={positive ? "M0 38 C14 36 18 26 29 29 S42 23 52 27 S68 16 76 22 S91 18 99 20 S112 11 122 15 S135 9 143 13 S153 6 160 3 V48 H0 Z" : "M0 9 C14 12 19 22 29 18 S42 24 52 21 S68 31 76 26 S91 33 99 29 S112 38 122 33 S135 38 143 35 S153 42 160 44 V48 H0 Z"}
        fill={`url(#${positive ? "spark-green" : "spark-red"})`}
      />
      <path
        d={positive ? "M0 38 C14 36 18 26 29 29 S42 23 52 27 S68 16 76 22 S91 18 99 20 S112 11 122 15 S135 9 143 13 S153 6 160 3" : "M0 9 C14 12 19 22 29 18 S42 24 52 21 S68 31 76 26 S91 33 99 29 S112 38 122 33 S135 38 143 35 S153 42 160 44"}
        fill="none"
        stroke={positive ? "#047857" : "#fb7185"}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AssetIcon({ market, size = "md" }: { market: Market; size?: "sm" | "md" }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-bold text-slate-950",
        size === "md" ? "h-10 w-10 text-xs" : "h-8 w-8 text-[10px]",
      )}
      style={{ background: `radial-gradient(circle at 30% 20%, #ffffff 0%, ${market.color} 32%, #111827 130%)` }}
    >
      {market.currency === "BTC" ? <Bitcoin className="h-5 w-5" /> : market.currency.slice(0, 1)}
    </span>
  );
}

export default function DefaultHomePage() {
  const { user } = useUserStore();
  const { settings } = useConfigStore();
  const [markets, setMarkets] = useState<Market[]>(fallbackMarkets);
  const [tickers, setTickers] = useState<Record<string, { last?: number; change?: number; quoteVolume?: number }>>({});
  const [marketFilter, setMarketFilter] = useState<"all" | "gainers" | "volume">("all");
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    const loadMarkets = async () => {
      try {
        const response = await fetch("/api/exchange/market", { credentials: "include" });
        if (!response.ok) return;
        const data = (await response.json()) as ApiMarket[];
        if (!active || !Array.isArray(data) || data.length === 0) return;
        setMarkets(
          data.slice(0, 12).map((item, index) => {
            const fallback = fallbackMarkets[index % fallbackMarkets.length];
            return {
              currency: item.currency || fallback.currency,
              pair: item.pair || "USDT",
              name: item.name || fallback.name,
              price: fallback.price,
              change: fallback.change,
              volume: fallback.volume,
              marketCap: Number(item.marketCap) || fallback.marketCap,
              color: fallback.color,
            };
          }),
        );
      } catch {
        // The public experience remains useful with the last known fallback snapshot.
      }
    };

    loadMarkets();
    try {
      tickersWs.initialize();
      unsubscribe = tickersWs.subscribeToSpotData((nextTickers) => {
        if (!active) return;
        setTickers({ ...nextTickers });
        setIsLive(true);
      });
    } catch {
      setIsLive(false);
    }

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const liveMarkets = useMemo(
    () =>
      markets.map((market) => {
        const ticker = tickers[`${market.currency}/${market.pair}`];
        return {
          ...market,
          price: Number(ticker?.last) || market.price,
          change: Number(ticker?.change) || market.change,
          volume: Number(ticker?.quoteVolume) || market.volume,
        };
      }),
    [markets, tickers],
  );

  const visibleMarkets = useMemo(() => {
    const next = [...liveMarkets];
    if (marketFilter === "gainers") return next.sort((a, b) => b.change - a.change).slice(0, 5);
    if (marketFilter === "volume") return next.sort((a, b) => b.volume - a.volume).slice(0, 5);
    return next.slice(0, 5);
  }, [liveMarkets, marketFilter]);

  const primaryLink = user ? "/market" : "/register";
  const spotEnabled = settings?.spotWallets !== false && settings?.spotWallets !== "false";

  return (
    <main className="overflow-hidden bg-[#f6f8fb] text-slate-900">
      <section className="relative isolate border-b border-slate-200/80">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_8%,rgba(16,185,129,0.12),transparent_30%),radial-gradient(circle_at_87%_18%,rgba(99,102,241,0.12),transparent_28%),linear-gradient(180deg,#ffffff_0%,#f6f8fb_76%)]" />
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.45] [background-image:linear-gradient(rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.05)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_84%)]" />

        <div className="mx-auto max-w-[1320px] px-5 pb-20 pt-28 sm:px-8 lg:pb-28 lg:pt-36">
          <div className="mb-16 flex items-center justify-between gap-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#047857] shadow-[0_0_14px_#047857]" />Quatava Markets</div>
            <div className="hidden items-center gap-2 sm:flex"><span className="text-slate-700">Global liquidity</span><span className="text-slate-300">24/7</span><Globe2 className="h-4 w-4 text-slate-500" /></div>
          </div>

          <div className="grid items-center gap-14 lg:grid-cols-[1.02fr_0.98fr] lg:gap-20">
            <div>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#047857]/20 bg-[#047857]/[0.08] px-3.5 py-2 text-xs font-bold text-[#047857]">
                <Sparkles className="h-3.5 w-3.5" /> Built for the next market cycle
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="max-w-3xl text-5xl font-semibold leading-[0.98] tracking-[-0.065em] text-slate-950 sm:text-6xl lg:text-[80px]">
                Crypto, all day.<br /><span className="bg-gradient-to-r from-[#047857] via-[#70e8c2] to-[#9aa7ff] bg-clip-text text-transparent">One clear terminal.</span>
              </motion.h1>
              <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="mt-7 max-w-xl text-base leading-7 text-slate-700 sm:text-lg">
                Move from signal to execution with a pro-grade crypto platform for spot, perpetuals, earn, and multi-chain money movement—all in one focused workspace.
              </motion.p>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href={primaryLink} className="group inline-flex h-13 items-center justify-center gap-3 rounded-xl bg-[#047857] px-6 text-sm font-bold text-[#ffffff] shadow-[0_14px_45px_rgba(4,120,87,0.18)] transition hover:bg-[#059669] active:scale-[0.98]">
                  {user ? "Open terminal" : "Create free account"}<ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
                <Link href="/market" className="inline-flex h-13 items-center justify-center gap-3 rounded-xl border border-slate-200/80 bg-slate-100/80 px-6 text-sm font-bold text-slate-950 transition hover:border-slate-300 hover:bg-slate-100 active:scale-[0.98]">
                  Explore markets<ArrowRight className="h-4 w-4 text-slate-700" />
                </Link>
              </motion.div>
              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-slate-500">
                {["Self-custody ready", "Proof-first security", "No hidden spreads"].map((item) => <span key={item} className="inline-flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-[#047857]" />{item}</span>)}
              </div>
            </div>

            <motion.div initial={{ opacity: 0, scale: 0.97, x: 16 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.6 }} className="relative">
              <div className="absolute -inset-8 rounded-[40px] bg-[#047857]/[0.08] blur-3xl" />
              <div className="relative overflow-hidden rounded-[26px] border border-slate-200/80 bg-white p-4 shadow-2xl shadow-slate-300/70 sm:p-5">
                <div className="flex items-center justify-between border-b border-slate-200/70 pb-4">
                  <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#047857]/10 text-[#047857]"><BarChart3 className="h-4 w-4" /></div><div><p className="text-xs font-semibold text-slate-950">Portfolio overview</p><p className="mt-0.5 text-[10px] text-slate-500">Personal account · USD</p></div></div>
                  <span className="flex items-center gap-1.5 rounded-full bg-[#047857]/10 px-2.5 py-1 text-[10px] font-bold text-[#047857]"><span className="h-1.5 w-1.5 rounded-full bg-[#047857]" />{isLive ? "Live" : "Preview"}</span>
                </div>
                <div className="grid gap-4 py-5 sm:grid-cols-[1fr_0.8fr]">
                  <div><p className="text-[11px] font-medium text-slate-500">Total balance</p><p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">$24,892.41</p><p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#047857]"><ArrowUpRight className="h-3.5 w-3.5" />+$1,284.16 <span className="font-normal text-slate-500">(5.44%)</span></p></div>
                  <div className="flex items-end"><Sparkline /></div>
                </div>
                <div className="grid grid-cols-3 gap-2 border-y border-slate-200/70 py-4 text-xs"><div><p className="text-slate-500">Available</p><p className="mt-1.5 font-semibold text-slate-950">$18,420.32</p></div><div><p className="text-slate-500">In orders</p><p className="mt-1.5 font-semibold text-slate-950">$4,218.90</p></div><div><p className="text-slate-500">Earned</p><p className="mt-1.5 font-semibold text-[#047857]">+$2,253.19</p></div></div>
                <div className="pt-4"><div className="mb-3 flex items-center justify-between"><p className="text-[11px] font-semibold text-slate-700">Asset allocation</p><Link href="/market" className="text-[10px] font-bold text-[#047857] hover:text-slate-950">View wallet <ChevronRight className="inline h-3 w-3" /></Link></div><div className="space-y-3">{liveMarkets.slice(0, 3).map((market, index) => <div key={market.currency} className="flex items-center gap-3"><AssetIcon market={market} size="sm" /><div className="min-w-0 flex-1"><div className="flex items-center justify-between text-xs"><span className="font-semibold text-slate-950">{market.currency}</span><span className="text-slate-700">{["42.8%", "28.1%", "16.4%"][index]}</span></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200/80"><div className="h-full rounded-full" style={{ width: ["78%", "54%", "32%"][index], background: market.color }} /></div></div></div>)}</div></div>
              </div>
            </motion.div>
          </div>

          <div className="mt-20 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-200/70 bg-slate-200/80 sm:grid-cols-4">
            {[{ value: "$3.8B+", label: "Volume traded" }, { value: "140+", label: "Markets" }, { value: "0.08%", label: "Maker fees" }, { value: "99.99%", label: "Platform uptime" }].map((stat) => <div key={stat.label} className="bg-white/80 px-5 py-5 sm:px-7"><p className="text-xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-2xl">{stat.value}</p><p className="mt-1 text-xs text-slate-500">{stat.label}</p></div>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1320px] px-5 py-20 sm:px-8 lg:py-28">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><div className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#047857]">Market pulse</div><h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">See the market clearly.</h2><p className="mt-3 max-w-lg text-sm leading-6 text-slate-500">A calm, live view of the assets that matter. Connect your account when you are ready to make a move.</p></div><Link href="/market" className="inline-flex items-center gap-2 text-sm font-bold text-[#047857] transition hover:text-slate-950">Open full market view<ArrowRight className="h-4 w-4" /></Link></div>
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95">
          <div className="flex flex-col gap-3 border-b border-slate-200/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div className="flex items-center gap-1 rounded-lg bg-slate-100/80 p-1">{[{ id: "all", label: "All markets" }, { id: "gainers", label: "Top gainers" }, { id: "volume", label: "High volume" }].map((tab) => <button type="button" key={tab.id} onClick={() => setMarketFilter(tab.id as typeof marketFilter)} className={cn("rounded-md px-3 py-2 text-xs font-semibold transition", marketFilter === tab.id ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-950")}>{tab.label}</button>)}</div><div className="flex items-center gap-2 text-[11px] text-slate-500"><Activity className="h-3.5 w-3.5 text-[#047857]" /> Data refreshes in real time</div></div>
          <div className="hidden grid-cols-[1.6fr_1fr_0.8fr_0.9fr_1.1fr] gap-4 px-6 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-700 sm:grid"><span>Asset</span><span>Last price</span><span>24h change</span><span>24h volume</span><span>Trend</span></div>
          <div className="divide-y divide-slate-200/80">{visibleMarkets.map((market) => <Link href={`/trade?symbol=${market.currency}${market.pair}`} key={market.currency} className="grid grid-cols-2 gap-4 px-4 py-4 transition hover:bg-slate-100/80 sm:grid-cols-[1.6fr_1fr_0.8fr_0.9fr_1.1fr] sm:px-6"><div className="flex items-center gap-3"><AssetIcon market={market} size="sm" /><div><p className="text-sm font-semibold text-slate-950">{market.name}</p><p className="mt-0.5 text-[11px] text-slate-500">{market.currency} / {market.pair}</p></div></div><div className="text-right sm:text-left"><p className="text-sm font-semibold text-slate-950">{formatPrice(market.price)}</p><p className="mt-0.5 text-[11px] text-slate-500 sm:hidden">{formatCompact(market.volume)} vol.</p></div><div className={cn("hidden text-sm font-semibold sm:block", market.change >= 0 ? "text-[#047857]" : "text-rose-400")}>{market.change >= 0 ? "+" : ""}{market.change.toFixed(2)}%</div><div className="hidden text-sm text-slate-700 sm:block">{formatCompact(market.volume)}</div><div className="col-span-2 flex items-center justify-between sm:col-span-1 sm:justify-start sm:gap-4"><div className="w-28"><Sparkline positive={market.change >= 0} compact /></div><span className={cn("text-xs font-semibold sm:hidden", market.change >= 0 ? "text-[#047857]" : "text-rose-400")}>{market.change >= 0 ? "+" : ""}{market.change.toFixed(2)}%</span><ArrowUpRight className="hidden h-4 w-4 text-slate-700 sm:block" /></div></Link>)}</div>
          <div className="border-t border-slate-200/70 px-4 py-4 text-center sm:px-6"><Link href={spotEnabled ? "/market" : "/register"} className="text-xs font-bold text-slate-700 transition hover:text-[#047857]">{spotEnabled ? "View all markets" : "Create an account to unlock markets"}<ArrowRight className="ml-1 inline h-3.5 w-3.5" /></Link></div>
        </div>
      </section>

      <section className="border-y border-slate-200/80 bg-[#eef2f6]">
        <div className="mx-auto max-w-[1320px] px-5 py-20 sm:px-8 lg:py-28"><div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20"><div><div className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#047857]">The Quatava edge</div><h2 className="max-w-md text-3xl font-semibold leading-tight tracking-[-0.04em] text-slate-950 sm:text-4xl">A sharper way to participate in crypto.</h2><p className="mt-5 max-w-md text-sm leading-7 text-slate-500">Every product decision is built around one idea: less noise between your conviction and your next move.</p><Link href="/register" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-[#047857] hover:text-slate-950">See how it works<ArrowRight className="h-4 w-4" /></Link></div><div className="grid gap-3 sm:grid-cols-2">{[{ icon: Zap, title: "Fast by default", body: "A responsive execution layer built to keep up when the market moves." }, { icon: Wallet, title: "One wallet, many rails", body: "Manage balances across chains, fiat on-ramps, and trading products." }, { icon: LockKeyhole, title: "Security you can feel", body: "Risk controls, 2FA, KYC, and transparent account activity at every step." }, { icon: Layers3, title: "More than spot", body: "Trade, earn, launch, and move value without switching platforms." }].map((feature) => <div key={feature.title} className="group rounded-2xl border border-slate-200/80 bg-[#eefbf6] p-6 transition hover:-translate-y-1 hover:border-[#047857]/25 hover:bg-[#eef2ff]"><div className="mb-7 flex h-10 w-10 items-center justify-center rounded-xl bg-[#047857]/10 text-[#047857] transition group-hover:bg-[#047857] group-hover:text-[#06110d]"><feature.icon className="h-5 w-5" /></div><h3 className="text-base font-semibold text-slate-950">{feature.title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{feature.body}</p></div>)}</div></div></div>
      </section>

      <section className="mx-auto max-w-[1320px] px-5 py-20 sm:px-8 lg:py-28"><div className="relative overflow-hidden rounded-[28px] border border-[#047857]/20 bg-[radial-gradient(circle_at_85%_15%,rgba(16,185,129,0.14),transparent_34%),linear-gradient(130deg,#ffffff,#f0fdf9_56%,#eef2ff)] px-6 py-12 sm:px-12 lg:flex lg:items-center lg:justify-between lg:gap-16 lg:px-16 lg:py-14"><div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border border-[#047857]/10" /><div className="relative max-w-2xl"><div className="mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#047857]"><CircleDollarSign className="h-4 w-4" />Ready when you are</div><h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">The market never clocks out.<br />Your terminal should not either.</h2><p className="mt-4 max-w-xl text-sm leading-6 text-slate-700">Start with a watchlist. Graduate to a strategy. Quatava gives you the infrastructure to keep going.</p></div><div className="relative mt-8 flex shrink-0 flex-col gap-3 sm:flex-row lg:mt-0"><Link href={primaryLink} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#047857] px-5 text-sm font-bold text-[#ffffff] transition hover:bg-[#059669]">{user ? "Open your account" : "Start for free"}<ArrowUpRight className="h-4 w-4" /></Link><Link href="/market" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100/80 px-5 text-sm font-bold text-slate-950 transition hover:bg-white"><Play className="h-3.5 w-3.5 fill-current" />Tour the terminal</Link></div></div></section>

      <section className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-4 px-5 pb-12 text-[11px] text-slate-700 sm:px-8"><span>Quatava is a technology platform, not financial advice.</span><span className="flex items-center gap-2"><TrendingUp className="h-3.5 w-3.5" />Market data is indicative and may be delayed.</span></section>
    </main>
  );
}
