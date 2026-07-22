"use client";

import { ArrowDown, ArrowUpDown, ArrowUp } from "lucide-react";

const TRANSACTIONS = [
  {
    type: "Deposit",
    date: "Jul 21, 2026",
    amount: "+0.25 BTC",
    icon: ArrowDown,
    color: "text-success",
    amountColor: "text-success",
  },
  {
    type: "Swap ETH → SOL",
    date: "Jul 20, 2026",
    amount: "2.0 ETH",
    icon: ArrowUpDown,
    color: "text-primary",
    amountColor: "",
  },
  {
    type: "Withdrawal",
    date: "Jul 19, 2026",
    amount: "−$1,200",
    icon: ArrowUp,
    color: "text-destructive",
    amountColor: "text-destructive",
  },
  {
    type: "Staking Reward",
    date: "Jul 18, 2026",
    amount: "+0.012 ETH",
    icon: ArrowDown,
    color: "text-success",
    amountColor: "text-success",
  },
];

export function RecentActivity() {
  return (
    <div className="bg-card border border-border p-4">
      <div className="flex justify-between items-center mb-4">
        <span className="font-extrabold text-sm tracking-tight">
          Recent Activity
        </span>
        <a
          href="#"
          className="text-xs text-primary font-semibold no-underline hover:underline"
        >
          History →
        </a>
      </div>
      {TRANSACTIONS.map((tx, i) => {
        const Icon = tx.icon;
        return (
          <div
            key={i}
            className="flex justify-between items-center py-2.5 border-b border-border/50 last:border-b-0 text-sm"
          >
            <div className="flex items-center gap-2.5">
              <div className={`w-7 h-7 flex items-center justify-center ${tx.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold">{tx.type}</div>
                <div className="text-[11px] text-muted-foreground">
                  {tx.date}
                </div>
              </div>
            </div>
            <span className={`font-semibold tabular-nums ${tx.amountColor}`}>
              {tx.amount}
            </span>
          </div>
        );
      })}
    </div>
  );
}
