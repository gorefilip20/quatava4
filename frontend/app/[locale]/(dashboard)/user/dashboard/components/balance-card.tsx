"use client";

import { useEffect } from "react";
import { TrendingUp, TrendingDown, Plus, ArrowUpRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useWalletStore } from "@/store/finance/wallet-store";

export function BalanceCard() {
  const router = useRouter();
  const { totalBalance, totalChange, totalChangePercent, isLoadingStats, fetchStats } =
    useWalletStore();

  useEffect(() => {
    fetchStats();
  }, []);

  const isPositive = totalChange >= 0;

  return (
    <div className="bg-gradient-to-br from-[#3375BB] to-[#1E4A7A] text-white p-8 grid grid-cols-1 sm:grid-cols-[1fr_auto] items-center gap-6">
      <div>
        <p className="text-[13px] opacity-80 uppercase tracking-wider m-0">
          Total Portfolio Value
        </p>
        {isLoadingStats ? (
          <div className="flex items-center gap-2 my-4">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <>
            <p className="text-[clamp(32px,4vw,44px)] font-extrabold tracking-tight my-2 tabular-nums">
              ${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div
              className={`text-sm flex items-center gap-1.5 ${
                isPositive ? "text-[#6EE7B7]" : "text-[#FCA5A5]"
              }`}
            >
              {isPositive ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              {isPositive ? "+" : ""}${totalChange.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({totalChangePercent.toFixed(1)}%) today
            </div>
          </>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <button
          onClick={() => router.push("/finance/deposit")}
          className="flex items-center gap-1.5 px-4.5 py-2.5 text-[13px] font-extrabold bg-white/20 text-white border-none cursor-pointer hover:bg-white/30 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Deposit
        </button>
        <button
          onClick={() => router.push("/finance/withdraw")}
          className="flex items-center gap-1.5 px-4.5 py-2.5 text-[13px] font-extrabold bg-transparent text-white border border-white/30 cursor-pointer hover:bg-white/10 transition-colors"
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
          Withdraw
        </button>
      </div>
    </div>
  );
}
