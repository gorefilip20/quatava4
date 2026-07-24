"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useWalletStore } from "@/store/finance/wallet-store";

export function AssetsTable() {
  const { spotWallets, fiatWallets, isLoading, fetchWallets } = useWalletStore();

  useEffect(() => {
    fetchWallets();
  }, []);

  const allWallets = [
    ...(spotWallets || []),
    ...(fiatWallets || []),
  ].filter((w: any) => w.balance > 0);

  return (
    <div className="bg-card dark:bg-[#161B22] border border-border p-4">
      <div className="flex justify-between items-center mb-4">
        <span className="font-extrabold text-sm tracking-tight">
          Your Assets
        </span>
        <a
          href="/finance/wallet"
          className="text-xs text-primary font-semibold no-underline hover:underline"
        >
          View All
        </a>
      </div>

      {/* Header */}
      <div className="grid grid-cols-4 gap-3 text-[10px] uppercase tracking-wider text-muted-foreground pb-2 border-b-2 border-border">
        <span>Asset</span>
        <span>Type</span>
        <span>Balance</span>
        <span>Currency</span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Loading assets...
        </div>
      ) : allWallets.length === 0 ? (
        <div className="py-6 text-center text-sm text-muted-foreground">
          No assets yet. Deposit to get started.
        </div>
      ) : (
        allWallets.slice(0, 8).map((wallet: any) => (
          <div
            key={wallet.id}
            className="grid grid-cols-4 gap-3 py-2.5 items-center border-b border-border/60 text-sm tabular-nums hover:bg-foreground/[0.02] transition-colors"
          >
            <div className="flex items-center gap-2.5 font-semibold">
              <div className="w-7 h-7 flex items-center justify-center text-[10px] font-extrabold bg-[var(--quatava-blue-100)] dark:bg-[rgba(51,117,187,0.15)] text-[var(--quatava-blue-700)] dark:text-[var(--quatava-blue-300)]">
                {wallet.currency}
              </div>
              {wallet.currency}
            </div>
            <span className="text-xs text-muted-foreground">{wallet.type}</span>
            <span>
              {parseFloat(wallet.balance).toLocaleString("en-US", {
                maximumFractionDigits: 8,
              })}
            </span>
            <span>{wallet.currency}</span>
          </div>
        ))
      )}
    </div>
  );
}
