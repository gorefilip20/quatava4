"use client";

import { Activity, ArrowUpDown, DollarSign, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";

const ACTIONS = [
  { label: "Trade", icon: Activity, href: "/trade" },
  { label: "Swap", icon: ArrowUpDown, href: "/convert" },
  { label: "Stake", icon: DollarSign, href: "/staking" },
  { label: "Convert", icon: UserPlus, href: "/convert" },
];

export function QuickActions() {
  const router = useRouter();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.label}
            onClick={() => router.push(action.href)}
            className="flex flex-col items-center gap-2 p-4 bg-card border border-border cursor-pointer text-foreground hover:bg-[hsl(var(--primary)/0.06)] transition-colors"
          >
            <div className="w-9 h-9 flex items-center justify-center bg-[hsl(var(--primary)/0.08)] text-primary">
              <Icon className="w-[18px] h-[18px]" />
            </div>
            <span className="text-xs font-semibold">{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}
