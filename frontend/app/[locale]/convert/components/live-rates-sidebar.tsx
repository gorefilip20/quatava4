"use client";

import { Check } from "lucide-react";

const NGN_RATES = [
  { pair: "BTC/NGN", flag: "🇳🇬", price: "₦104.6M", change: "+2.3%", up: true },
  { pair: "ETH/NGN", flag: "🇳🇬", price: "₦5.43M", change: "+1.9%", up: true },
  { pair: "USDT/NGN", flag: "🇳🇬", price: "₦1,542", change: "0.0%", up: false },
  { pair: "SOL/NGN", flag: "🇳🇬", price: "₦275K", change: "−0.9%", down: true },
];

const OTHER_RATES = [
  { currency: "USD", flag: "🇺🇸", price: "$67,842", change: "+2.3%", up: true },
  { currency: "GBP", flag: "🇬🇧", price: "£53,841", change: "+2.1%", up: true },
  { currency: "EUR", flag: "🇪🇺", price: "€62,490", change: "+2.2%", up: true },
  { currency: "MXN", flag: "🇲🇽", price: "$1.18M", change: "+2.5%", up: true },
  { currency: "AED", flag: "🇦🇪", price: "249,109", change: "+2.3%", up: true },
];

const WHY_CONVERT = [
  "No middlemen — instant at market rate",
  "Direct to your bank in seconds",
  "No scam risk — fully automated",
  "Supports 6+ fiat currencies",
];

export function LiveRatesSidebar() {
  return (
    <div className="space-y-4">
      {/* NGN rates */}
      <div className="bg-card border border-border p-4">
        <div className="flex justify-between items-center mb-4">
          <span className="font-extrabold text-sm">Live Rates (NGN)</span>
          <span className="text-[11px] text-muted-foreground">
            Updates every 30s
          </span>
        </div>
        <div className="flex flex-col">
          {NGN_RATES.map((rate) => (
            <div
              key={rate.pair}
              className="grid grid-cols-3 gap-2 py-2.5 border-b border-border/50 last:border-b-0 text-sm items-center tabular-nums"
            >
              <div className="flex items-center gap-2 font-semibold">
                <div className="w-6 h-6 flex items-center justify-center bg-[hsl(var(--primary)/0.08)] text-[13px]">
                  {rate.flag}
                </div>
                {rate.pair}
              </div>
              <span className="font-semibold">{rate.price}</span>
              <span
                className={`text-xs ${
                  rate.up
                    ? "text-success"
                    : (rate as any).down
                      ? "text-destructive"
                      : "text-muted-foreground"
                }`}
              >
                {rate.change}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Other currencies */}
      <div className="bg-card border border-border p-4">
        <div className="flex justify-between items-center mb-4">
          <span className="font-extrabold text-sm">Other Currencies</span>
        </div>
        <div className="flex flex-col">
          {OTHER_RATES.map((rate) => (
            <div
              key={rate.currency}
              className="grid grid-cols-3 gap-2 py-2.5 border-b border-border/50 last:border-b-0 text-sm items-center tabular-nums"
            >
              <div className="flex items-center gap-2 font-semibold">
                <div className="w-6 h-6 flex items-center justify-center bg-[hsl(var(--primary)/0.08)] text-[13px]">
                  {rate.flag}
                </div>
                {rate.currency}
              </div>
              <span className="font-semibold">{rate.price}</span>
              <span className="text-xs text-success">{rate.change}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Why Convert */}
      <div className="bg-card border border-border p-4">
        <div className="flex justify-between items-center mb-4">
          <span className="font-extrabold text-sm">Why Convert?</span>
        </div>
        <div className="flex flex-col gap-3 text-sm">
          {WHY_CONVERT.map((reason, i) => (
            <div key={i} className="flex gap-2.5">
              <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
              <span>{reason}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
