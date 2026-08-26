"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpDown,
  ArrowUpRight,
  BarChart3,
  Bitcoin,
  ChevronDown,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Volume2,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { tickersWs } from "@/services/tickers-ws";
import SiteHeader from "@/components/partials/header/site-header";
import { cn } from "@/lib/utils";

type Market = {
  currency: string;
  pair: string;
  name: string;
  price: number;
  change24h: number;
  volume: number;
  marketCap: number;
  color: string;
};

const fallbackMarkets: Market[] = [
  { currency: "BTC", pair: "USDT", name: "Bitcoin", price: 109482.18, change24h: 2.84, volume: 42.8e9, marketCap: 2.17e12, color: "#f7931a" },
  { currency: "ETH", pair: "USDT", name: "Ethereum", price: 4028.64, change24h: 1.96, volume: 18.4e9, marketCap: 485.5e9, color: "#627eea" },
  { currency: "SOL", pair: "USDT", name: "Solana", price: 248.12, change24h: 5.42, volume: 6.8e9, marketCap: 118.2e9, color: "#14f195" },
  { currency: "BNB", pair: "USDT", name: "BNB", price: 712.38, change24h: -0.74, volume: 2.9e9, marketCap: 105.2e9, color: "#f3ba2f" },
  { currency: "XRP", pair: "USDT", name: "XRP", price: 2.31, change24h: 3.18, volume: 2.2e9, marketCap: 134.7e9, color: "#9ca3af" },
  { currency: "QTAVA", pair: "USDT", name: "Quatava", price: 0.0842, change24h: 8.61, volume: 142.6e6, marketCap: 84.2e6, color: "#8b5cf6" },
];

const compact = (value: number) => {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  return `$${(value / 1e3).toFixed(0)}K`;
};

const price = (value: number) => {
  if (value >= 1000) return `$${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  if (value >= 1) return `$${value.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: 4, minimumFractionDigits: 4 })}`;
};

function AssetIcon({ market }: { market: Market }) {
  return <span className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-slate-950" style={{ background: `radial-gradient(circle at 28% 20%, white 0%, ${market.color} 34%, #111827 130%)` }}>{market.currency === "BTC" ? <Bitcoin className="h-5 w-5" /> : market.currency.slice(0, 1)}</span>;
}

function Sparkline({ positive }: { positive: boolean }) {
  return <svg viewBox="0 0 160 42" preserveAspectRatio="none" className="h-9 w-full"><path d={positive ? "M0 33 C10 31 16 26 24 28 S38 21 47 26 S59 17 69 22 S85 15 95 18 S108 8 120 13 S139 5 160 2 V42 H0 Z" : "M0 7 C12 9 17 16 28 13 S41 20 52 17 S67 27 77 22 S90 31 102 27 S119 36 128 31 S144 39 160 38 V42 H0 Z"} fill={positive ? "rgba(57,226,155,0.13)" : "rgba(251,113,133,0.12)"} /><path d={positive ? "M0 33 C10 31 16 26 24 28 S38 21 47 26 S59 17 69 22 S85 15 95 18 S108 8 120 13 S139 5 160 2" : "M0 7 C12 9 17 16 28 13 S41 20 52 17 S67 27 77 22 S90 31 102 27 S119 36 128 31 S144 39 160 38"} fill="none" stroke={positive ? "#047857" : "#fb7185"} strokeLinecap="round" strokeWidth="2.2" /></svg>;
}

export default function MarketPage() {
  const [markets, setMarkets] = useState<Market[]>(fallbackMarkets);
  const [tickers, setTickers] = useState<Record<string, { last?: number; change?: number; quoteVolume?: number }>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "gainers" | "losers" | "volume">("all");
  const [sortBy, setSortBy] = useState<"volume" | "price" | "change" | "marketCap">("volume");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    const loadMarkets = async () => {
      try {
        const response = await fetch("/api/exchange/market", { credentials: "include" });
        if (!response.ok) return;
        const data = await response.json();
        if (!active || !Array.isArray(data) || data.length === 0) return;
        setMarkets(data.slice(0, 50).map((item: any, index: number) => {
          const fallback = fallbackMarkets[index % fallbackMarkets.length];
          return { currency: item.currency || fallback.currency, pair: item.pair || fallback.pair, name: item.name || fallback.name, price: fallback.price, change24h: fallback.change24h, volume: fallback.volume, marketCap: Number(item.marketCap) || fallback.marketCap, color: fallback.color };
        }));
      } catch {
        // Keep the curated snapshot so the explorer remains useful during maintenance or first boot.
      }
    };
    loadMarkets();
    try {
      tickersWs.initialize();
      unsubscribe = tickersWs.subscribeToSpotData((nextTickers) => {
        if (!active) return;
        setTickers((previous) => ({ ...previous, ...nextTickers }));
        setIsLive(true);
      });
    } catch {
      setIsLive(false);
    }
    return () => { active = false; unsubscribe?.(); };
  }, []);

  const processedMarkets = useMemo(() => {
    return markets.map((market) => {
      const ticker = tickers[`${market.currency}/${market.pair}`];
      return { ...market, price: Number(ticker?.last) || market.price, change24h: Number(ticker?.change) || market.change24h, volume: Number(ticker?.quoteVolume) || market.volume };
    }).filter((market) => {
      const query = searchTerm.trim().toLowerCase();
      const matchesSearch = !query || market.currency.toLowerCase().includes(query) || market.name.toLowerCase().includes(query) || `${market.currency}/${market.pair}`.toLowerCase().includes(query);
      const matchesFilter = selectedFilter === "all" || (selectedFilter === "gainers" && market.change24h > 0) || (selectedFilter === "losers" && market.change24h < 0) || (selectedFilter === "volume" && market.volume >= 1e9);
      return matchesSearch && matchesFilter;
    }).sort((a, b) => {
      const values = { volume: [a.volume, b.volume], price: [a.price, b.price], change: [a.change24h, b.change24h], marketCap: [a.marketCap, b.marketCap] }[sortBy];
      return sortOrder === "desc" ? values[1] - values[0] : values[0] - values[1];
    });
  }, [markets, tickers, searchTerm, selectedFilter, sortBy, sortOrder]);

  const stats = useMemo(() => ({ total: processedMarkets.length, gainers: processedMarkets.filter((market) => market.change24h > 0).length, losers: processedMarkets.filter((market) => market.change24h < 0).length, volume: processedMarkets.reduce((sum, market) => sum + market.volume, 0) }), [processedMarkets]);

  const toggleSort = (nextSort: typeof sortBy) => {
    if (nextSort === sortBy) setSortOrder((order) => order === "desc" ? "asc" : "desc");
    else { setSortBy(nextSort); setSortOrder("desc"); }
  };

  return <main className="min-h-screen bg-[#f6f8fb] text-slate-900"><SiteHeader /><div className="border-b border-slate-200/80 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.12),transparent_34%),linear-gradient(180deg,#ffffff,#f6f8fb)] px-5 pb-12 pt-32 sm:px-8 lg:pb-16"><div className="mx-auto max-w-[1320px]"><div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-700"><BarChart3 className="h-3.5 w-3.5" /> Cryptocurrency markets</div><div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end"><div><h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.055em] text-slate-950 sm:text-6xl">Explore the <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-[#047857] bg-clip-text text-transparent">market surface.</span></h1><p className="mt-5 max-w-2xl text-base leading-7 text-slate-700">Live prices, 24-hour momentum, and liquidity signals for every market on Quatava.</p></div><div className="flex items-center gap-2 text-xs text-slate-500"><span className={cn("h-2 w-2 rounded-full", isLive ? "bg-[#047857] shadow-[0_0_12px_#047857]" : "bg-slate-600")} />{isLive ? "Live market data" : "Indicative snapshot"}<ChevronDown className="h-3.5 w-3.5" /></div></div><div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">{[{ icon: BarChart3, label: "Markets", value: stats.total }, { icon: TrendingUp, label: "24h gainers", value: stats.gainers, tone: "green" }, { icon: TrendingDown, label: "24h losers", value: stats.losers, tone: "red" }, { icon: Volume2, label: "Tracked volume", value: compact(stats.volume), tone: "violet" }].map((stat) => <div key={stat.label} className="rounded-2xl border border-slate-200/80 bg-slate-100/80 p-4"><div className="flex items-center gap-2 text-xs text-slate-500"><stat.icon className={cn("h-4 w-4", stat.tone === "green" ? "text-[#047857]" : stat.tone === "red" ? "text-rose-400" : stat.tone === "violet" ? "text-violet-700" : "text-indigo-700")} />{stat.label}</div><p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">{stat.value}</p></div>)}</div></div></div><div className="mx-auto max-w-[1320px] px-5 py-10 sm:px-8 lg:py-14"><div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><label className="relative block w-full sm:max-w-sm"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search BTC, ETH, or a market" className="h-11 w-full rounded-xl border border-slate-200/80 bg-slate-100/80 pl-10 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-700 focus:border-[#047857]/50 focus:ring-2 focus:ring-[#047857]/10" /></label><div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-100/80 p-1">{[{ id: "all", label: "All markets" }, { id: "gainers", label: "Gainers" }, { id: "losers", label: "Losers" }, { id: "volume", label: "High volume" }].map((filter) => <button type="button" key={filter.id} onClick={() => setSelectedFilter(filter.id as typeof selectedFilter)} className={cn("rounded-lg px-3 py-2 text-xs font-semibold transition", selectedFilter === filter.id ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-950")}>{filter.label}</button>)}</div></div><div className="mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white"><div className="hidden grid-cols-[1.6fr_1fr_0.9fr_0.9fr_1fr_0.95fr] gap-4 border-b border-slate-200/70 px-6 py-4 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-700 lg:grid"><span>Asset</span><button type="button" onClick={() => toggleSort("price")} className="flex items-center gap-1 text-left">Last price<ArrowUpDown className="h-3 w-3" /></button><button type="button" onClick={() => toggleSort("change")} className="flex items-center gap-1 text-left">24h change<ArrowUpDown className="h-3 w-3" /></button><button type="button" onClick={() => toggleSort("volume")} className="flex items-center gap-1 text-left">24h volume<ArrowUpDown className="h-3 w-3" /></button><span>Trend</span><span>Action</span></div>{processedMarkets.length ? <div className="divide-y divide-slate-200/80">{processedMarkets.map((market) => <Link key={`${market.currency}-${market.pair}`} href={`/trade?symbol=${market.currency}${market.pair}`} className="grid gap-4 px-4 py-5 transition hover:bg-slate-100/80 lg:grid-cols-[1.6fr_1fr_0.9fr_0.9fr_1fr_0.95fr] lg:px-6"><div className="flex items-center gap-3"><AssetIcon market={market} /><div><p className="text-sm font-semibold text-slate-950">{market.name}</p><p className="mt-1 text-[11px] text-slate-500">{market.currency} / {market.pair}</p></div></div><div className="flex items-center justify-between text-sm font-semibold text-slate-950 lg:justify-start">{price(market.price)}<span className="text-[11px] font-normal text-slate-500 lg:hidden">{compact(market.volume)} vol.</span></div><div className={cn("text-sm font-semibold", market.change24h >= 0 ? "text-[#047857]" : "text-rose-400")}>{market.change24h >= 0 ? "+" : ""}{market.change24h.toFixed(2)}%</div><div className="hidden text-sm text-slate-700 lg:block">{compact(market.volume)}</div><div className="hidden items-center lg:flex"><div className="w-36"><Sparkline positive={market.change24h >= 0} /></div></div><div className="hidden items-center gap-2 text-xs font-semibold text-slate-500 lg:flex">Trade {market.change24h >= 0 ? <ArrowUpRight className="h-4 w-4 text-[#047857]" /> : <ArrowDownRight className="h-4 w-4 text-rose-400" />}</div></Link>)}</div> : <div className="px-6 py-20 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"><Search className="h-6 w-6" /></div><h2 className="mt-5 text-lg font-semibold text-slate-950">No matching markets</h2><p className="mt-2 text-sm text-slate-500">Try a different symbol or clear your current filters.</p></div>}<div className="border-t border-slate-200/70 px-6 py-4 text-center text-xs text-slate-700"><Sparkles className="mr-1 inline h-3.5 w-3.5 text-[#047857]" />Quotes are indicative and may be delayed until you connect a live account.</div></div></div><section className="mx-auto max-w-[1320px] px-5 pb-16 sm:px-8"><div className="flex flex-col justify-between gap-6 rounded-2xl border border-[#047857]/15 bg-emerald-50 p-7 sm:flex-row sm:items-center sm:p-9"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#047857]">Ready for the next move?</p><h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">Trade with the full Quatava toolkit.</h2><p className="mt-2 text-sm text-slate-500">Advanced charts, risk controls, and one wallet for every strategy.</p></div><Link href="/register" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#047857] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#059669]">Create free account<ArrowRight className="h-4 w-4" /></Link></div></section></main>;
}
