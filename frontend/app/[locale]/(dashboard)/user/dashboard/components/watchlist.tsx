"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { $fetch } from "@/lib/api";

interface RateItem {
  pair: string;
  price: string;
}

const WATCHLIST_PAIRS = [
  { from: "BTC", to: "USDT" },
  { from: "ETH", to: "USDT" },
  { from: "SOL", to: "USDT" },
  { from: "XRP", to: "USDT" },
];

export function Watchlist() {
  const [items, setItems] = useState<RateItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchPrices() {
    const results: RateItem[] = [];

    for (const pair of WATCHLIST_PAIRS) {
      const { data } = await $fetch<{ rate: number }>({
        url: "/api/finance/convert/rate",
        method: "GET",
        params: {
          fromCurrency: pair.from,
          fromType: "SPOT",
          toCurrency: pair.to,
          toType: "SPOT",
        },
        silent: true,
      });

      const rate = data?.rate || 0;
      let formatted: string;
      if (rate >= 1000) {
        formatted = `$${rate.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
      } else if (rate >= 1) {
        formatted = `$${rate.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      } else {
        formatted = `$${rate.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`;
      }

      results.push({
        pair: `${pair.from}/${pair.to}`,
        price: rate > 0 ? formatted : "—",
      });
    }

    setItems(results);
    setLoading(false);
  }

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-card border border-border p-4">
      <div className="flex justify-between items-center mb-4">
        <span className="font-extrabold text-sm tracking-tight">Watchlist</span>
        <span className="text-[11px] text-muted-foreground">Live</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Loading prices...
        </div>
      ) : (
        items.map((item) => (
          <div
            key={item.pair}
            className="flex justify-between items-center py-2.5 border-b border-border/50 last:border-b-0 text-sm hover:bg-foreground/[0.02] transition-colors"
          >
            <span className="font-semibold">{item.pair}</span>
            <span className="tabular-nums font-semibold">{item.price}</span>
          </div>
        ))
      )}
    </div>
  );
}
