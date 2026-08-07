"use client";

import { useConvertStore } from "@/store/convert";
import { Loader2 } from "lucide-react";

export function RecentConversions() {
  const { recentConversions, isLoadingHistory } = useConvertStore();

  if (isLoadingHistory) {
    return (
      <div className="bg-card border border-border p-8 mt-4 flex items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading history...
      </div>
    );
  }

  if (!recentConversions.length) {
    return (
      <div className="bg-card border border-border p-6 mt-4 text-center text-sm text-muted-foreground">
        No conversions yet. Make your first conversion above.
      </div>
    );
  }

  return (
    <div className="bg-card border border-border p-4 mt-4">
      <div className="flex justify-between items-center mb-4">
        <span className="font-extrabold text-sm">Recent Conversions</span>
      </div>
      {recentConversions.map((record) => {
        const status = record.status?.toLowerCase();
        const date = record.createdAt
          ? new Date(record.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "";

        return (
          <div
            key={record.id}
            className="grid grid-cols-[auto_2fr_1fr_1fr_1fr] gap-3 py-3 items-center border-b border-border/50 last:border-b-0 text-sm hover:bg-foreground/[0.02] transition-colors"
          >
            <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-[hsl(var(--primary)/0.1)] text-primary">
              Convert
            </span>
            <span className="font-semibold">
              {record.fromAmount} {record.fromCurrency} → {record.toAmount != null
                ? typeof record.toAmount === "number"
                  ? record.toAmount.toLocaleString("en-US", { maximumFractionDigits: 8 })
                  : record.toAmount
                : "—"}{" "}
              {record.toCurrency}
            </span>
            <span className="tabular-nums text-xs text-muted-foreground">
              Rate: {record.rate ? record.rate.toLocaleString("en-US", { maximumFractionDigits: 8 }) : "—"}
            </span>
            <span className="text-xs text-muted-foreground">{date}</span>
            <span
              className={`text-[11px] font-semibold ${
                status === "completed"
                  ? "text-success"
                  : status === "pending"
                    ? "text-warning"
                    : "text-destructive"
              }`}
            >
              {status === "completed"
                ? "Completed"
                : status === "pending"
                  ? "Pending"
                  : "Failed"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
