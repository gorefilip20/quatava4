"use client";

import Link from "next/link";
import { routing, usePathname } from "@/i18n/routing";
import {
  ArrowLeftRight,
  CreditCard,
  BarChart3,
  Bot,
  CandlestickChart,
  ChevronDown,
  CircleDollarSign,
  Gift,
  Globe2,
  Image as ImageIcon,
  LayoutDashboard,
  Menu,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  Wallet,
  X,
} from "lucide-react";
import { useState } from "react";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, section: "MAIN" },
  { label: "Wallet", href: "/finance/wallet", icon: Wallet },
  { label: "Spot Trading", href: "/trade", icon: CandlestickChart, section: "TRADING" },
  { label: "Futures", href: "/trade?type=futures", icon: BarChart3 },
  { label: "Convert", href: "/finance/transfer", icon: ArrowLeftRight },
  { label: "Send Money", href: "/send-money", icon: Globe2 },
  { label: "Staking", href: "/staking", icon: CircleDollarSign, section: "INVEST" },
  { label: "Inflation Tracker", href: "/inflation", icon: TrendingDown },
  { label: "Quatava Card", href: "/card", icon: CreditCard, section: "FEATURES" },
  { label: "Quatava Circle", href: "/circle", icon: Gift },
  { label: "NFT Marketplace", href: "/nft/marketplace", icon: ImageIcon },
  { label: "AI Trading", href: "/ai/trading", icon: Bot },
];

export default function QuatavaTerminalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const locale = routing.locales.find(
    (candidate) =>
      pathname === `/${candidate}` || pathname.startsWith(`/${candidate}/`)
  ) || routing.defaultLocale;
  const pathWithoutLocale = routing.locales.some(
    (candidate) =>
      pathname === `/${candidate}` || pathname.startsWith(`/${candidate}/`)
  )
    ? pathname.replace(new RegExp(`^/${locale}`), "") || "/"
    : pathname || "/";
  const hrefFor = (href: string) => `/${locale}${href || "/"}`;

  const isActive = (href: string) => {
    const cleanHref = href.split("?")[0] || "/";
    return cleanHref === "/" ? pathWithoutLocale === "/" : pathWithoutLocale.startsWith(cleanHref);
  };

  return (
    <div className="min-h-screen bg-[#f7f8fb] text-[#152033]">
      <div className="flex min-h-screen">
        <aside className={`${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} fixed inset-y-0 left-0 z-50 flex w-[232px] flex-col border-r border-[#e4e8ef] bg-white transition-transform lg:sticky lg:top-0 lg:h-screen`}>
          <div className="flex h-[72px] items-center gap-3 border-b border-[#edf0f4] px-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2d78b7] text-white shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-[15px] font-bold tracking-tight">Quatava</span>
            <button onClick={() => setMobileOpen(false)} className="ml-auto rounded-md p-1 text-slate-400 lg:hidden" aria-label="Close menu"><X className="h-5 w-5" /></button>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-5">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label}>
                  {item.section && <div className="px-3 pb-2 pt-4 text-[9px] font-bold tracking-[0.16em] text-[#97a1af]">{item.section}</div>}
                  <Link href={hrefFor(item.href)} onClick={() => setMobileOpen(false)} className={`mb-1 flex items-center gap-3 rounded-md px-3 py-2.5 text-[12px] transition-colors ${isActive(item.href) ? "bg-[#eaf3fb] font-semibold text-[#216da9]" : "text-[#667085] hover:bg-[#f4f7fa] hover:text-[#1d5f91]"}`}>
                    <Icon className="h-[15px] w-[15px]" strokeWidth={1.8} />
                    <span>{item.label}</span>
                  </Link>
                </div>
              );
            })}
          </nav>
          <div className="border-t border-[#edf0f4] p-3">
            <Link href={hrefFor("/user/profile")} className="flex items-center gap-3 rounded-md px-3 py-2 text-[12px] text-[#667085] hover:bg-[#f4f7fa]"><Settings2 className="h-4 w-4" />Settings</Link>
            <div className="mt-2 flex items-center gap-2 rounded-md bg-[#f7f9fb] px-3 py-2 text-[11px] text-[#687588]"><ShieldCheck className="h-4 w-4 text-emerald-500" />Account protected</div>
          </div>
        </aside>

        {mobileOpen && <button className="fixed inset-0 z-40 bg-slate-900/20 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex h-[72px] items-center gap-4 border-b border-[#e4e8ef] bg-white/95 px-4 backdrop-blur lg:px-7">
            <button onClick={() => setMobileOpen(true)} className="rounded-md p-2 text-slate-500 lg:hidden" aria-label="Open menu"><Menu className="h-5 w-5" /></button>
            <div className="relative max-w-[420px] flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa4b2]" /><input aria-label="Search" placeholder="Search markets, assets..." className="h-9 w-full rounded-md border border-[#e1e6ed] bg-[#f8fafc] pl-9 pr-3 text-xs text-[#334155] outline-none placeholder:text-[#a1aab7] focus:border-[#68a5d1]" /></div>
            <div className="hidden items-center gap-4 text-xs text-[#8a94a3] sm:flex"><span>EN</span><span>USD</span><ChevronDown className="h-3.5 w-3.5" /></div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2874b1] text-[10px] font-bold text-white">MR</div>
          </header>
          <main className="min-h-[calc(100vh-72px)] p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
