"use client";

const ASSETS = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    balance: "1.4523",
    value: "$98,562",
    change: "+2.3%",
    up: true,
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    balance: "4.2100",
    value: "$14,827",
    change: "+1.9%",
    up: true,
  },
  {
    symbol: "SOL",
    name: "Solana",
    balance: "32.50",
    value: "$5,800",
    change: "−0.9%",
    up: false,
  },
  {
    symbol: "USDT",
    name: "Tether",
    balance: "5,642",
    value: "$5,642",
    change: "0.0%",
    neutral: true,
  },
];

export function AssetsTable() {
  return (
    <div className="bg-card border border-border p-4">
      <div className="flex justify-between items-center mb-4">
        <span className="font-extrabold text-sm tracking-tight">
          Your Assets
        </span>
        <a
          href="#"
          className="text-xs text-primary font-semibold no-underline hover:underline"
        >
          View All →
        </a>
      </div>

      {/* Header */}
      <div className="grid grid-cols-4 gap-3 text-[10px] uppercase tracking-wider text-muted-foreground pb-2 border-b-2 border-border">
        <span>Asset</span>
        <span>Balance</span>
        <span>Value</span>
        <span>24h</span>
      </div>

      {/* Rows */}
      {ASSETS.map((asset) => (
        <div
          key={asset.symbol}
          className="grid grid-cols-4 gap-3 py-2.5 items-center border-b border-border/60 text-sm tabular-nums hover:bg-foreground/[0.02] transition-colors"
        >
          <div className="flex items-center gap-2.5 font-semibold">
            <div className="w-7 h-7 flex items-center justify-center text-[10px] font-extrabold bg-[hsl(var(--primary)/0.08)] text-[var(--quatava-blue-700)] dark:text-[hsl(var(--primary)/0.7)]">
              {asset.symbol}
            </div>
            {asset.name}
          </div>
          <span>{asset.balance}</span>
          <span>{asset.value}</span>
          <span
            className={
              asset.up
                ? "text-success"
                : asset.neutral
                  ? "text-muted-foreground"
                  : "text-destructive"
            }
          >
            {asset.change}
          </span>
        </div>
      ))}
    </div>
  );
}
