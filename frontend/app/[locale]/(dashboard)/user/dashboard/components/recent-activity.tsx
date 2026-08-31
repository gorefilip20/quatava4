"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
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

const MOCK_ACTIVITY = [
  {
    id: "1",
    type: "deposit",
    title: "USDT Deposit",
    amount: "+500.00 USDT",
    time: "2 hours ago",
    borderColor: "bg-success",
  },
  {
    id: "2",
    type: "withdrawal",
    title: "BTC Withdrawal",
    amount: "-0.005 BTC",
    time: "5 hours ago",
    borderColor: "bg-destructive",
  },
  {
    id: "3",
    type: "trade",
    title: "ETH/USDT Buy",
    amount: "+0.42 ETH",
    time: "8 hours ago",
    borderColor: "bg-primary",
  },
  {
    id: "4",
    type: "deposit",
    title: "Bank Transfer (ARS)",
    amount: "+25,000 ARS",
    time: "1 day ago",
    borderColor: "bg-success",
  },
  {
    id: "5",
    type: "trade",
    title: "BTC/USDT Sell",
    amount: "-0.012 BTC",
    time: "1 day ago",
    borderColor: "bg-primary",
  },
  {
    id: "6",
    type: "withdrawal",
    title: "USDC Send",
    amount: "-150.00 USDC",
    time: "2 days ago",
    borderColor: "bg-destructive",
  },
];

function getBorderColor(type: string) {
  if (type.includes("INCOMING") || type.includes("DEPOSIT")) return "bg-success";
  if (type.includes("OUTGOING") || type.includes("WITHDRAW")) return "bg-destructive";
  return "bg-primary";
}

function formatAmount(tx: Transaction) {
  const currency = tx.wallet?.currency || "";
  const amount = tx.amount.toLocaleString("en-US", { maximumFractionDigits: 8 });
  if (tx.type.includes("INCOMING") || tx.type.includes("DEPOSIT"))
    return `+${amount} ${currency}`;
  if (tx.type.includes("OUTGOING") || tx.type.includes("WITHDRAW"))
    return `-${amount} ${currency}`;
  return `${amount} ${currency}`;
}

function formatType(type: string, description: string) {
  if (description)
    return description.length > 28 ? description.slice(0, 28) + "..." : description;
  const labels: Record<string, string> = {
    INCOMING_TRANSFER: "Received",
    OUTGOING_TRANSFER: "Sent",
    DEPOSIT: "Deposit",
    WITHDRAW: "Withdrawal",
    TRADE: "Trade",
  };
  return (
    labels[type] ||
    type
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/^\w/, (c) => c.toUpperCase())
  );
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function RecentActivity() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await $fetch<{ data: Transaction[] }>({
        url: "/api/finance/transaction",
        method: "GET",
        params: { perPage: 6, sortField: "createdAt", sortOrder: "desc" },
        silent: true,
      });
      if (data?.data) {
        setTransactions(data.data);
      }
      setLoading(false);
    }
    load();
  }, []);

  const showMock = transactions.length === 0 && !loading;

  return (
    <div className="bg-card border border-border">
      <div className="flex justify-between items-center px-5 py-4 border-b border-border">
        <span className="font-extrabold text-[15px] tracking-tight">
          Recent Activity
        </span>
        <a
          href="/finance/transaction"
          className="text-[12px] text-primary font-bold no-underline hover:underline"
        >
          History
        </a>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          <span className="text-[13px]">Loading...</span>
        </div>
      ) : showMock ? (
        <div className="divide-y divide-border/50">
          {MOCK_ACTIVITY.map((item) => (
            <div
              key={item.id}
              className="flex items-stretch hover:bg-foreground/[0.02] transition-colors"
            >
              {/* Colored left stripe */}
              <div className={`w-[3px] ${item.borderColor} shrink-0`} />
              <div className="flex-1 flex justify-between items-center px-4 py-3.5">
                <div>
                  <span className="text-[13px] font-semibold block leading-tight">
                    {item.title}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {item.time}
                  </span>
                </div>
                <span
                  className={`text-[13px] font-bold tabular-nums ${
                    item.type === "deposit"
                      ? "text-success"
                      : item.type === "withdrawal"
                        ? "text-destructive"
                        : "text-primary"
                  }`}
                >
                  {item.amount}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          {transactions.map((tx) => {
            const borderColor = getBorderColor(tx.type);
            const isIn =
              tx.type.includes("INCOMING") || tx.type.includes("DEPOSIT");
            const isOut =
              tx.type.includes("OUTGOING") || tx.type.includes("WITHDRAW");
            return (
              <div
                key={tx.id}
                className="flex items-stretch hover:bg-foreground/[0.02] transition-colors"
              >
                <div className={`w-[3px] ${borderColor} shrink-0`} />
                <div className="flex-1 flex justify-between items-center px-4 py-3.5">
                  <div>
                    <span className="text-[13px] font-semibold block leading-tight">
                      {formatType(tx.type, tx.description)}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {timeAgo(tx.createdAt)}
                    </span>
                  </div>
                  <span
                    className={`text-[13px] font-bold tabular-nums ${
                      isIn
                        ? "text-success"
                        : isOut
                          ? "text-destructive"
                          : "text-primary"
                    }`}
                  >
                    {formatAmount(tx)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
