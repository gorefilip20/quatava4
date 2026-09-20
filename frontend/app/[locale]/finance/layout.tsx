"use client";

import type { ReactNode } from "react";

const financeMenu = [
  {
    key: "wallets",
    title: "Wallets",
    href: "/finance/wallet",
    icon: "lucide:wallet",
  },
  {
    key: "deposit",
    title: "Deposit",
    href: "/finance/deposit",
    icon: "lucide:arrow-down-to-line",
  },
  {
    key: "withdraw",
    title: "Withdraw",
    href: "/finance/withdraw",
    icon: "lucide:arrow-up-from-line",
  },
  {
    key: "transfer",
    title: "Transfer",
    href: "/finance/transfer",
    icon: "lucide:arrow-left-right",
  },
  {
    key: "history",
    title: "History",
    href: "/finance/history",
    icon: "lucide:history",
  },
];

export default function FinanceLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
