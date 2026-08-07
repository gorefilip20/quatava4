"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUpDown, ArrowUp, Loader2 } from "lucide-react";
import { $fetch } from "@/lib/api";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  fee: number;
  status: string;
  description: string;
  createdAt: string;
  wallet?: {
    currency: string;
    type: string;
  };
}

function getIcon(type: string) {
  if (type.includes("INCOMING") || type.includes("DEPOSIT")) return ArrowDown;
  if (type.includes("OUTGOING") || type.includes("WITHDRAW")) return ArrowUp;
  return ArrowUpDown;
}

function getColor(type: string) {
  if (type.includes("INCOMING") || type.includes("DEPOSIT")) return "text-success";
  if (type.includes("OUTGOING") || type.includes("WITHDRAW")) return "text-destructive";
  return "text-primary";
}

function formatAmount(tx: Transaction) {
  const currency = tx.wallet?.currency || "";
  const amount = tx.amount.toLocaleString("en-US", { maximumFractionDigits: 8 });

  if (tx.type.includes("INCOMING") || tx.type.includes("DEPOSIT")) {
    return `+${amount} ${currency}`;
  }
  if (tx.type.includes("OUTGOING") || tx.type.includes("WITHDRAW")) {
    return `-${amount} ${currency}`;
  }
  return `${amount} ${currency}`;
}

function formatType(type: string, description: string) {
  if (description) return description.length > 30 ? description.slice(0, 30) + "..." : description;

  const labels: Record<string, string> = {
    INCOMING_TRANSFER: "Received",
    OUTGOING_TRANSFER: "Sent",
    DEPOSIT: "Deposit",
    WITHDRAW: "Withdrawal",
    TRADE: "Trade",
    BINARY_ORDER: "Binary Order",
    INVESTMENT: "Investment",
  };
  return labels[type] || type.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

export function RecentActivity() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await $fetch<{ data: Transaction[] }>({
        url: "/api/finance/transaction",
        method: "GET",
        params: { perPage: 5, sortField: "createdAt", sortOrder: "desc" },
        silent: true,
      });
      if (data?.data) {
        setTransactions(data.data);
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="bg-card dark:bg-[#161B22] border border-border p-4">
      <div className="flex justify-between items-center mb-4">
        <span className="font-extrabold text-sm tracking-tight">
          Recent Activity
        </span>
        <a
          href="/finance/transaction"
          className="text-xs text-primary font-semibold no-underline hover:underline"
        >
          History
        </a>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Loading...
        </div>
      ) : transactions.length === 0 ? (
        <div className="py-6 text-center text-sm text-muted-foreground">
          No recent activity.
        </div>
      ) : (
        transactions.map((tx) => {
          const Icon = getIcon(tx.type);
          const color = getColor(tx.type);
          return (
            <div
              key={tx.id}
              className="flex justify-between items-center py-2.5 border-b border-border/50 last:border-b-0 text-sm"
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 flex items-center justify-center ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold">{formatType(tx.type, tx.description)}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {new Date(tx.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>
              </div>
              <span className={`font-semibold tabular-nums ${color}`}>
                {formatAmount(tx)}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}
