"use client";

import { Link } from "@/i18n/routing";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  Bell,
  CircleDollarSign,
  Eye,
  EyeOff,
  Globe2,
  Headphones,
  LineChart,
  Plus,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { useWalletStore } from "@/store/finance/wallet-store";
import { useNotificationsStore } from "@/store/notification-store";

const watchlist = [
  ["Bitcoin", "BTC", "#f59e0b"],
  ["Ethereum", "ETH", "#6366f1"],
  ["Solana", "SOL", "#10b981"],
  ["XRP", "XRP", "#64748b"],
];

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function DashboardPage() {
  const [hidden, setHidden] = useState(false);
  const { fiatWallets, spotWallets, futuresWallets, isLoading, fetchWallets } =
    useWalletStore();
  const { stats, fetchNotifications } = useNotificationsStore();

  useEffect(() => {
    void fetchWallets();
    void fetchNotifications();
  }, [fetchNotifications, fetchWallets]);

  const wallets = useMemo(
    () => [...(spotWallets || []), ...(fiatWallets || []), ...(futuresWallets || [])],
    [fiatWallets, futuresWallets, spotWallets]
  );
  const totalValue = wallets.reduce(
    (sum, wallet: any) => sum + toNumber(wallet.value ?? wallet.balanceUsd ?? wallet.usdValue),
    0
  );
  const fiatValue = wallets
    .filter((wallet: any) => String(wallet.type).toUpperCase() === "FIAT")
    .reduce((sum, wallet: any) => sum + toNumber(wallet.value ?? wallet.balanceUsd ?? wallet.usdValue), 0);
  const spotValue = wallets
    .filter((wallet: any) => String(wallet.type).toUpperCase() === "SPOT")
    .reduce((sum, wallet: any) => sum + toNumber(wallet.value ?? wallet.balanceUsd ?? wallet.usdValue), 0);
  const hasLiveBalances = totalValue > 0;
  const money = (value: number) =>
    `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  const display = (value: string) => (hidden ? "••••••" : value);

  return (
    <div className="mx-auto max-w-[1180px] space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#2c78b6]">
            Quatava hub
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#182536]">
            Your money, one clear terminal.
          </h1>
          <p className="mt-1 text-xs text-[#7a8696]">
            Wallet, markets, regional transfers, and support in one place.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/platform"
            className="inline-flex items-center gap-2 rounded-md border border-[#dce3ea] bg-white px-3 py-2 text-xs font-semibold text-[#526174]"
          >
            <Globe2 className="h-3.5 w-3.5" /> Regional hub
          </Link>
          <button
            type="button"
            onClick={() => setHidden((value) => !value)}
            className="inline-flex items-center gap-2 rounded-md border border-[#dce3ea] bg-white px-3 py-2 text-xs font-medium text-[#5f6d7e]"
          >
            {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {hidden ? "Show balances" : "Hide balances"}
          </button>
        </div>
      </div>

      {!isLoading && !hasLiveBalances && (
        <div className="flex flex-col gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-[11px] text-amber-900 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Your account is ready, but live balances appear after the wallet service and database are connected.
          </span>
          <Link href="/finance/deposit" className="font-bold text-amber-950 underline underline-offset-2">
            Add funds
          </Link>
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["TOTAL PORTFOLIO", hasLiveBalances ? money(totalValue) : "—", hasLiveBalances ? "Live wallet data" : "Awaiting wallet data"],
          ["FIAT BALANCE", hasLiveBalances ? money(fiatValue) : "—", hasLiveBalances ? "Local-currency rails" : "Connect a funding rail"],
          ["DIGITAL ASSETS", hasLiveBalances ? money(spotValue) : "—", hasLiveBalances ? "Spot wallet value" : "No assets loaded"],
          ["UNREAD UPDATES", String(stats.unread || 0), stats.unread ? "Review account activity" : "You are all caught up"],
        ].map(([label, value, caption]) => (
          <div key={label} className="rounded-md border border-[#dfe5ec] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <p className="text-[9px] font-semibold tracking-[0.08em] text-[#8b96a4]">{label}</p>
            <p className="mt-2 text-xl font-bold text-[#253348]">{label === "UNREAD UPDATES" ? value : display(value)}</p>
            <p className="mt-1 text-[10px] font-semibold text-[#7c8795]">{caption}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <div className="rounded-md border border-[#dfe5ec] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="flex items-center justify-between border-b border-[#edf0f4] px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-[#263548]">Build your Quatava flow</h2>
              <p className="mt-1 text-[10px] text-[#8b96a4]">Move from first value to confident activity.</p>
            </div>
            <Sparkles className="h-4 w-4 text-[#2876b3]" />
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            {[
              { title: "Fund locally", description: "Deposit BRL, ARS, COP, CLP, or USD through a supported rail.", href: "/finance/deposit", Icon: ArrowDownToLine },
              { title: "Send across borders", description: "Get a quote and track a regional transfer from one screen.", href: "/send-money", Icon: ArrowLeftRight },
              { title: "Research markets", description: "Open a watchlist, compare markets, and use paper mode before trading.", href: "/market", Icon: LineChart },
              { title: "Protect your account", description: "Finish verification, review security, and contact support when needed.", href: "/support", Icon: ShieldCheck },
            ].map(({ title, description, href, Icon: FeatureIcon }) => {
              return (
                <Link key={title} href={href} className="group rounded-md border border-[#e5e9ee] p-4 transition hover:-translate-y-0.5 hover:border-[#9fc8e5] hover:bg-[#fbfdff]">
                  <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-[#eaf3fb] text-[#2876b3] group-hover:bg-[#2876b3] group-hover:text-white"><FeatureIcon className="h-4 w-4" /></div>
                  <p className="text-xs font-semibold text-[#354154]">{title}</p>
                  <p className="mt-1 text-[10px] leading-5 text-[#7a8696]">{description}</p>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-md border border-[#dfe5ec] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="flex items-center justify-between border-b border-[#edf0f4] px-5 py-4">
            <div><h2 className="text-sm font-semibold text-[#263548]">Market watchlist</h2><p className="mt-1 text-[10px] text-[#8b96a4]">Open a market when you are ready.</p></div>
            <Link href="/market" className="text-[10px] font-semibold text-[#2876b3]">View all</Link>
          </div>
          <div className="divide-y divide-[#f0f2f5]">
            {watchlist.map(([name, symbol, color]) => (
              <Link href={`/trade?symbol=${symbol}USDT`} key={symbol} className="flex items-center justify-between px-5 py-3 hover:bg-[#fafbfd]">
                <div className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: color }}>{symbol[0]}</span><div><p className="text-xs font-semibold text-[#354154]">{name}</p><p className="text-[9px] text-[#9aa4b1]">{symbol}/USDT</p></div></div>
                <span className="text-[10px] font-semibold text-[#7a8696]">Open market →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-md border border-[#dfe5ec] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="flex items-center justify-between border-b border-[#edf0f4] px-5 py-4"><div><h2 className="text-sm font-semibold text-[#263548]">Quick actions</h2><p className="mt-1 text-[10px] text-[#8b96a4]">Common actions stay one tap away.</p></div><Bell className="h-4 w-4 text-[#9aa4b1]" /></div>
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <Link href="/finance/deposit" className="flex items-center gap-3 rounded-md border border-[#e5e9ee] p-3 text-xs font-medium text-[#526174] hover:border-[#9fc8e5]"><ArrowDownToLine className="h-4 w-4 text-[#2876b3]" />Deposit</Link>
          <Link href="/finance/withdraw" className="flex items-center gap-3 rounded-md border border-[#e5e9ee] p-3 text-xs font-medium text-[#526174] hover:border-[#9fc8e5]"><ArrowUpFromLine className="h-4 w-4 text-[#2876b3]" />Withdraw</Link>
          <Link href="/finance/transfer" className="flex items-center gap-3 rounded-md border border-[#e5e9ee] p-3 text-xs font-medium text-[#526174] hover:border-[#9fc8e5]"><ArrowLeftRight className="h-4 w-4 text-[#2876b3]" />Convert</Link>
          <Link href="/staking" className="flex items-center gap-3 rounded-md border border-[#e5e9ee] p-3 text-xs font-medium text-[#526174] hover:border-[#9fc8e5]"><CircleDollarSign className="h-4 w-4 text-[#2876b3]" />Earn</Link>
          <Link href="/support" className="flex items-center gap-3 rounded-md border border-[#e5e9ee] p-3 text-xs font-medium text-[#526174] hover:border-[#9fc8e5]"><Headphones className="h-4 w-4 text-[#2876b3]" />Support</Link>
        </div>
      </section>
    </div>
  );
}
