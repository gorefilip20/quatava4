"use client";

import { useConvertStore } from "@/store/convert";

const TYPE_STYLES: Record<string, string> = {
  convert: "bg-[hsl(var(--primary)/0.1)] text-primary",
  buy: "bg-[hsl(160_81%_40%/0.1)] text-success",
  send: "bg-[hsl(262_83%_58%/0.1)] text-[#8B5CF6]",
};

export function RecentConversions() {
  const { recentConversions } = useConvertStore();

  return (
    <div className="bg-card border border-border p-4 mt-4">
      <div className="flex justify-between items-center mb-4">
        <span className="font-extrabold text-sm">Recent Conversions</span>
        <a
          href="#"
          className="text-xs text-primary font-semibold no-underline hover:underline"
        >
          View All →
        </a>
      </div>
      {recentConversions.map((record) => (
        <div
          key={record.id}
          className="grid grid-cols-[auto_2fr_1fr_1fr_1fr] gap-3 py-3 items-center border-b border-border/50 last:border-b-0 text-sm hover:bg-foreground/[0.02] transition-colors"
        >
          <span
            className={`px-2 py-0.5 text-[10px] font-extrabold uppercase ${TYPE_STYLES[record.type] ?? ""}`}
          >
            {record.type}
          </span>
          <span className="font-semibold">{record.description}</span>
          <span className="tabular-nums">{record.destination}</span>
          <span className="text-xs text-muted-foreground">{record.date}</span>
          <span
            className={`text-[11px] font-semibold ${
              record.status === "completed"
                ? "text-success"
                : record.status === "pending"
                  ? "text-warning"
                  : "text-destructive"
            }`}
          >
            {record.status === "completed"
              ? "✓ Completed"
              : record.status === "pending"
                ? "⏳ Pending"
                : "✗ Failed"}
          </span>
        </div>
      ))}
    </div>
  );
}
