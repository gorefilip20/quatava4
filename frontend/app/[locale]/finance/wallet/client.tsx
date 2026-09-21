"use client";

import { Link } from "@/i18n/routing";
import { useEffect, useMemo, useState } from "react";
import { ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine, Search, WalletCards } from "lucide-react";
import { useWalletStore } from "@/store/finance/wallet-store";

function normalizeWallet(wallet: any) {
  const currency = String(wallet?.currency || wallet?.symbol || wallet?.asset || "BTC").toUpperCase();
  const balance = Number(wallet?.balance ?? wallet?.amount ?? wallet?.total ?? 0);
  const value = Number(wallet?.value ?? wallet?.balanceUsd ?? wallet?.usdValue ?? 0);
  return {
    currency,
    name: wallet?.name || currency,
    type: String(wallet?.type || "SPOT").toUpperCase(),
    balance,
    value,
    balanceLabel: balance ? balance.toLocaleString(undefined, { maximumFractionDigits: 6 }) : "0.000000",
    valueLabel: value ? `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "$0.00",
    change: wallet?.changePercent !== undefined && wallet?.changePercent !== null ? `${Number(wallet.changePercent) >= 0 ? "+" : ""}${wallet.changePercent}%` : "—",
    color: currency === "BTC" ? "#f59e0b" : currency === "ETH" ? "#6366f1" : "#16a05d",
  };
}

export function WalletDashboard() {
  const { fiatWallets, spotWallets, futuresWallets, isLoading, fetchWallets } = useWalletStore();
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const liveWallets = useMemo(
    () => [...(spotWallets || []), ...(fiatWallets || []), ...(futuresWallets || [])].map(normalizeWallet),
    [fiatWallets, futuresWallets, spotWallets]
  );
  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? liveWallets.filter((asset) => `${asset.currency} ${asset.name} ${asset.type}`.toLowerCase().includes(query)) : liveWallets;
  }, [liveWallets, search]);
  const isUnavailable = !liveWallets.length && !isLoading;
  const hasValuedWallet = liveWallets.some((wallet) => Number.isFinite(wallet.value) && wallet.value > 0);
  const totalValue = liveWallets.reduce((sum, wallet) => sum + (Number.isFinite(wallet.value) ? wallet.value : 0), 0);
  const spotValue = liveWallets.filter((wallet) => wallet.type === "SPOT").reduce((sum, wallet) => sum + wallet.value, 0);
  const fiatValue = liveWallets.filter((wallet) => wallet.type === "FIAT").reduce((sum, wallet) => sum + wallet.value, 0);
  const money = (value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  const href = (path: string) => path;

  return (
    <div className="mx-auto max-w-[1180px] space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#2c78b6]"><WalletCards className="h-3.5 w-3.5" /> Wallet</div>
          <h1 className="text-2xl font-bold tracking-tight text-[#182536]">Wallet</h1>
          <p className="mt-1 text-xs text-[#7a8696]">Manage your digital assets in one place.</p>
        </div>
        {isUnavailable && <span className="inline-flex w-fit items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-[10px] font-semibold text-rose-700">Live wallet data unavailable</span>}
      </div>

      <section className="grid gap-3 md:grid-cols-3">
        {[
          ["TOTAL BALANCE", hasValuedWallet ? money(totalValue) : "—", hasValuedWallet ? "Live wallet data" : "Connect database to load"],
          ["SPOT BALANCE", hasValuedWallet ? money(spotValue) : "—", hasValuedWallet ? "Live wallet data" : "Connect database to load"],
          ["FIAT BALANCE", hasValuedWallet ? money(fiatValue) : "—", hasValuedWallet ? "Live wallet data" : "Connect database to load"],
        ].map(([label, value, caption], index) => <div key={label} className="rounded-md border border-[#dfe5ec] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"><p className="text-[9px] font-semibold tracking-[0.08em] text-[#8b96a4]">{label}</p><p className="mt-2 text-xl font-bold text-[#253348]">{value}</p><p className={`mt-1 text-[10px] font-semibold ${index === 1 && hasValuedWallet ? "text-emerald-600" : "text-[#a0a8b2]"}`}>{caption}</p></div>)}
      </section>

      <div className="flex flex-wrap gap-2">
        <Link href={href("/finance/deposit")} className="inline-flex items-center gap-2 rounded-md bg-[#2876b3] px-4 py-2 text-xs font-semibold text-white"><ArrowDownToLine className="h-3.5 w-3.5" />Deposit</Link>
        <Link href={href("/finance/withdraw")} className="inline-flex items-center gap-2 rounded-md border border-[#dce3ea] bg-white px-4 py-2 text-xs font-medium text-[#5f6d7e]"><ArrowUpFromLine className="h-3.5 w-3.5" />Withdraw</Link>
        <Link href={href("/finance/transfer")} className="inline-flex items-center gap-2 rounded-md border border-[#dce3ea] bg-white px-4 py-2 text-xs font-medium text-[#5f6d7e]"><ArrowLeftRight className="h-3.5 w-3.5" />Convert</Link>
      </div>

      <section className="overflow-hidden rounded-md border border-[#dfe5ec] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="flex flex-col justify-between gap-3 border-b border-[#edf0f4] px-5 py-4 sm:flex-row sm:items-center"><div><h2 className="text-sm font-semibold text-[#263548]">Wallet Assets</h2><p className="mt-1 text-[10px] text-[#8b96a4]">Your balances across supported assets</p></div><div className="relative w-full sm:w-48"><Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9aa4b2]" /><input aria-label="Search assets" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search assets" className="h-8 w-full rounded border border-[#e1e6ed] bg-[#f8fafc] pl-8 pr-2 text-[10px] outline-none focus:border-[#68a5d1]" /></div></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left"><thead className="bg-[#fafbfd] text-[9px] font-semibold uppercase tracking-[0.08em] text-[#8b96a4]"><tr><th className="px-5 py-3">Asset</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Balance</th><th className="px-4 py-3">Value (USD)</th><th className="px-4 py-3">24h</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-[#f0f2f5]">{rows.map((asset) => <tr key={`${asset.currency}-${asset.type}`} className="text-[11px] text-[#536173] hover:bg-[#fbfcfd]"><td className="px-5 py-3"><div className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: asset.color }}>{asset.currency[0]}</span><div><p className="font-semibold text-[#354154]">{asset.name}</p><p className="text-[9px] text-[#9aa4b1]">{asset.currency}</p></div></div></td><td className="px-4 py-3"><span className="rounded bg-[#edf5fb] px-2 py-1 text-[9px] font-semibold text-[#2876b3]">{asset.type}</span></td><td className="px-4 py-3 font-medium text-[#354154]">{asset.balanceLabel}</td><td className="px-4 py-3 font-medium text-[#354154]">{asset.valueLabel}</td><td className="px-4 py-3 font-semibold text-emerald-600">{asset.change}</td><td className="px-4 py-3 text-right"><div className="flex justify-end gap-2 text-[10px] font-semibold"><Link href={href("/finance/deposit")} className="text-[#2876b3]">Deposit</Link><Link href={href("/finance/withdraw")} className="text-[#2876b3]">Withdraw</Link><Link href={`${href("/trade")}?symbol=${asset.currency}USDT`} className="text-[#2876b3]">Trade</Link></div></td></tr>)}</tbody></table></div>
        {!isLoading && !rows.length && <p className="border-t border-[#edf0f4] px-5 py-6 text-center text-[10px] text-[#8b96a4]">{search ? "No assets match your search." : "No wallet assets are available."}</p>}
        {isLoading && <p className="border-t border-[#edf0f4] px-5 py-3 text-[10px] text-[#8b96a4]">Refreshing wallet data…</p>}
        {isUnavailable && <p className="border-t border-[#edf0f4] px-5 py-3 text-[10px] text-rose-600">No balances are displayed because the wallet API is unavailable.</p>}
      </section>
    </div>
  );
}

export default WalletDashboard;
