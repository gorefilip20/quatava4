"use client";

import { useState } from "react";
import { useWalletStore } from "@/store/finance/wallet-store";

const TIME_RANGES = ["24H", "7D", "1M", "1Y"];

export function PortfolioChart() {
  const [activeRange, setActiveRange] = useState("7D");
  const { totalBalance } = useWalletStore();

  return (
    <div className="bg-card border border-border p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <span className="font-extrabold text-sm tracking-tight">
            Portfolio Performance
          </span>
          {totalBalance > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Current: ${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {TIME_RANGES.map((range) => (
            <button
              key={range}
              onClick={() => setActiveRange(range)}
              className={`text-[11px] px-2 py-1 font-semibold cursor-pointer border-none ${
                activeRange === range
                  ? "bg-primary text-white"
                  : "bg-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>
      <div className="h-[200px] relative">
        <svg
          viewBox="0 0 400 120"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3375BB" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#3375BB" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0,90 C20,85 40,78 60,72 C80,66 100,80 120,68 C140,56 160,48 180,52 C200,56 220,44 240,38 C260,32 280,40 300,28 C320,22 340,18 360,24 C380,20 395,12 400,10 L400,120 L0,120Z"
            fill="url(#chartGrad)"
          />
          <path
            d="M0,90 C20,85 40,78 60,72 C80,66 100,80 120,68 C140,56 160,48 180,52 C200,56 220,44 240,38 C260,32 280,40 300,28 C320,22 340,18 360,24 C380,20 395,12 400,10"
            fill="none"
            stroke="#3375BB"
            strokeWidth="2"
          />
        </svg>
      </div>
    </div>
  );
}
