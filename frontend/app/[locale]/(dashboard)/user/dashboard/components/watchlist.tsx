"use client";

const WATCHLIST_DATA = [
  { pair: "BTC/USDT", price: "$67,842", up: true },
  { pair: "ETH/USDT", price: "$3,521", up: true },
  { pair: "SOL/USDT", price: "$178.45", up: false },
  { pair: "XRP/USDT", price: "$0.6234", up: true },
  { pair: "TON/USDT", price: "$7.82", up: true },
  { pair: "DOGE/USDT", price: "$0.1423", up: false },
];

export function Watchlist() {
  return (
    <div className="bg-card border border-border p-4">
      <div className="flex justify-between items-center mb-4">
        <span className="font-extrabold text-sm tracking-tight">Watchlist</span>
        <a
          href="#"
          className="text-xs text-primary font-semibold no-underline hover:underline"
        >
          Edit
        </a>
      </div>
      {WATCHLIST_DATA.map((item) => (
        <div
          key={item.pair}
          className="flex justify-between items-center py-2.5 border-b border-border/50 last:border-b-0 text-sm hover:bg-foreground/[0.02] transition-colors"
        >
          <span className="font-semibold">{item.pair}</span>
          <span
            className={`tabular-nums ${item.up ? "text-success" : "text-destructive"}`}
          >
            {item.price}
          </span>
        </div>
      ))}
    </div>
  );
}
