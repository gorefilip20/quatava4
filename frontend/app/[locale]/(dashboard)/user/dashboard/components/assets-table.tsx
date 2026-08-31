"use client";

import { useEffect } from "react";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { useWalletStore } from "@/store/finance/wallet-store";

const MOCK_ASSETS = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    holdings: 0.0234,
    value: 1521.42,
    change24h: 2.4,
    allocation: 15.5,
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    holdings: 1.847,
    value: 4612.32,
    change24h: -1.2,
    allocation: 46.9,
  },
  {
    symbol: "USDT",
    name: "Tether",
    holdings: 2500.0,
    value: 2500.0,
    change24h: 0.01,
    allocation: 25.4,
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    holdings: 1200.0,
    value: 1200.0,
    change24h: 0.0,
    allocation: 12.2,
  },
];

export function AssetsTable() {
  const { spotWallets, fiatWallets, isLoading, fetchWallets } =
    useWalletStore();

  useEffect(() => {
    fetchWallets();
  }, []);

  // Use real wallets if available, otherwise show demo data
  const allWallets = [
    ...(spotWallets || []),
    ...(fiatWallets || []),
  ].filter((w: any) => w.balance > 0);

  const showMock = allWallets.length === 0 && !isLoading;

  return (
    <div className="bg-card border border-border">
      <div className="flex justify-between items-center px-5 py-4 border-b border-border">
        <span className="font-extrabold text-[15px] tracking-tight">
          Asset Holdings
        </span>
        <a
          href="/finance/wallet"
          className="text-[12px] text-primary font-bold no-underline hover:underline"
        >
          View All
        </a>
      </div>

      {/* Table header */}
      <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_1.2fr] gap-3 px-5 py-3 border-b border-border">
        <span className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground">
          Asset
        </span>
        <span className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground text-right">
          Holdings
        </span>
        <span className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground text-right">
          Value
        </span>
        <span className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground text-right">
          24h Change
        </span>
        <span className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground">
          Allocation
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          <span className="text-[13px]">Loading assets...</span>
        </div>
      ) : showMock ? (
        MOCK_ASSETS.map((asset) => {
          const isUp = asset.change24h >= 0;
          return (
            <div
              key={asset.symbol}
              className="grid grid-cols-2 sm:grid-cols-[2fr_1fr_1fr_1fr_1.2fr] gap-3 px-5 py-3.5 border-b border-border/50 items-center hover:bg-foreground/[0.02] transition-colors"
            >
              {/* Asset */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 flex items-center justify-center bg-primary/[0.08] text-[10px] font-extrabold text-primary shrink-0">
                  {asset.symbol}
                </div>
                <div>
                  <span className="text-[13px] font-bold block leading-tight">
                    {asset.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {asset.symbol}
                  </span>
                </div>
              </div>

              {/* Holdings */}
              <span className="text-[13px] font-semibold tabular-nums text-right hidden sm:block">
                {asset.holdings.toLocaleString("en-US", {
                  maximumFractionDigits: 4,
                })}{" "}
                <span className="text-muted-foreground text-[11px]">
                  {asset.symbol}
                </span>
              </span>

              {/* Value */}
              <span className="text-[13px] font-bold tabular-nums text-right">
                $
                {asset.value.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>

              {/* 24h Change */}
              <span
                className={`text-[13px] font-bold tabular-nums text-right hidden sm:flex items-center justify-end gap-1 ${
                  isUp ? "text-success" : "text-destructive"
                }`}
              >
                {isUp ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {isUp ? "+" : ""}
                {asset.change24h.toFixed(2)}%
              </span>

              {/* Allocation bar */}
              <div className="hidden sm:flex items-center gap-2">
                <div className="flex-1 h-[6px] bg-border overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${asset.allocation}%` }}
                  />
                </div>
                <span className="text-[11px] text-muted-foreground tabular-nums w-[36px] text-right">
                  {asset.allocation}%
                </span>
              </div>
            </div>
          );
        })
      ) : (
        allWallets.slice(0, 8).map((wallet: any) => (
          <div
            key={wallet.id}
            className="grid grid-cols-2 sm:grid-cols-[2fr_1fr_1fr_1fr_1.2fr] gap-3 px-5 py-3.5 border-b border-border/50 items-center hover:bg-foreground/[0.02] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 flex items-center justify-center bg-primary/[0.08] text-[10px] font-extrabold text-primary">
                {wallet.currency}
              </div>
              <div>
                <span className="text-[13px] font-bold">{wallet.currency}</span>
                <span className="text-[11px] text-muted-foreground block">
                  {wallet.type}
                </span>
              </div>
            </div>
            <span className="text-[13px] font-semibold tabular-nums text-right hidden sm:block">
              {parseFloat(wallet.balance).toLocaleString("en-US", {
                maximumFractionDigits: 8,
              })}
            </span>
            <span className="text-[13px] font-bold tabular-nums text-right">
              --
            </span>
            <span className="text-[13px] text-muted-foreground text-right hidden sm:block">
              --
            </span>
            <div className="hidden sm:block">
              <div className="h-[6px] bg-border" />
            </div>
          </div>
        ))
      )}
    </div>
  );
}
