"use client";

import { useEffect } from "react";
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { useWalletStore } from "@/store/finance/wallet-store";

const ASSET_MINI_CARDS = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    balance: 0.0234,
    value: 1521.42,
    change: 2.4,
    bars: [40, 55, 45, 60, 50, 65, 72, 68, 75, 80, 70, 78],
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    balance: 1.847,
    value: 4612.32,
    change: -1.2,
    bars: [70, 65, 72, 60, 55, 50, 58, 48, 52, 45, 50, 55],
  },
  {
    symbol: "USDT",
    name: "Tether",
    balance: 2500.0,
    value: 2500.0,
    change: 0.01,
    bars: [50, 50, 51, 50, 50, 51, 50, 50, 50, 51, 50, 50],
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    balance: 1200.0,
    value: 1200.0,
    change: 0.0,
    bars: [50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50],
  },
];

export function BalanceCard() {
  const {
    totalBalance,
    totalChange,
    totalChangePercent,
    isLoadingStats,
    fetchStats,
  } = useWalletStore();

  useEffect(() => {
    fetchStats();
  }, []);

  const isPositive = totalChange >= 0;
  const displayBalance = totalBalance || 9833.74;
  const displayChange = totalChange || 127.43;
  const displayPercent = totalChangePercent || 1.31;

  return (
    <div className="space-y-3">
      {/* Hero balance */}
      <div className="bg-card border border-border p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-[0.06em] font-bold text-muted-foreground">
              Total Portfolio Value
            </span>
            {isLoadingStats ? (
              <div className="flex items-center gap-2 mt-3">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-[36px] font-extrabold tracking-[-0.02em] tabular-nums">
                  $
                  {displayBalance.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span
                  className={`text-[14px] font-bold flex items-center gap-1 ${
                    isPositive ? "text-success" : "text-destructive"
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  {isPositive ? "+" : ""}$
                  {displayChange.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  ({displayPercent.toFixed(2)}%)
                </span>
              </div>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground mt-2 sm:mt-0 sm:mb-1">
            24h change
          </span>
        </div>
      </div>

      {/* Mini asset cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {ASSET_MINI_CARDS.map((asset) => {
          const isUp = asset.change >= 0;
          return (
            <div
              key={asset.symbol}
              className="bg-card border border-border p-4 flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 flex items-center justify-center bg-primary/[0.08] text-[10px] font-extrabold text-primary">
                    {asset.symbol}
                  </div>
                  <div>
                    <span className="text-[13px] font-bold block leading-tight">
                      {asset.symbol}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {asset.name}
                    </span>
                  </div>
                </div>
                <span
                  className={`text-[11px] font-bold ${
                    isUp ? "text-success" : "text-destructive"
                  }`}
                >
                  {isUp ? "+" : ""}
                  {asset.change.toFixed(2)}%
                </span>
              </div>

              {/* CSS sparkline bars */}
              <div className="flex items-end gap-[2px] h-[20px]">
                {asset.bars.map((h, i) => (
                  <div
                    key={i}
                    className="flex-1"
                    style={{
                      height: `${h}%`,
                      backgroundColor: isUp
                        ? "var(--success)"
                        : "var(--destructive)",
                      opacity: 0.3 + (i / asset.bars.length) * 0.7,
                    }}
                  />
                ))}
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-[12px] text-muted-foreground tabular-nums">
                  {asset.balance.toLocaleString("en-US", {
                    maximumFractionDigits: 4,
                  })}
                </span>
                <span className="text-[13px] font-bold tabular-nums">
                  $
                  {asset.value.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
