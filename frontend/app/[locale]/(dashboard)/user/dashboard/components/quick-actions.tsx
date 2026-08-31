"use client";

import { ArrowDownToLine, Send, RefreshCw, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

const ACTIONS = [
  {
    label: "Deposit",
    icon: ArrowDownToLine,
    href: "/finance/deposit",
    bg: "bg-primary/[0.08]",
    text: "text-primary",
  },
  {
    label: "Send",
    icon: Send,
    href: "/finance/withdraw",
    bg: "bg-success/[0.08]",
    text: "text-success",
  },
  {
    label: "Convert",
    icon: RefreshCw,
    href: "/convert",
    bg: "bg-warning/[0.08]",
    text: "text-warning",
  },
  {
    label: "Shield",
    icon: Shield,
    href: "/dollar-shield",
    bg: "bg-destructive/[0.08]",
    text: "text-destructive",
  },
];

export function QuickActions() {
  const router = useRouter();

  return (
    <div className="grid grid-cols-4 gap-3">
      {ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.label}
            onClick={() => router.push(action.href)}
            className="flex flex-col items-center gap-2.5 py-5 bg-card border border-border cursor-pointer text-foreground hover:border-primary transition-colors"
          >
            <div
              className={`w-11 h-11 flex items-center justify-center ${action.bg}`}
            >
              <Icon className={`w-5 h-5 ${action.text}`} />
            </div>
            <span className="text-[12px] font-bold">{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}
