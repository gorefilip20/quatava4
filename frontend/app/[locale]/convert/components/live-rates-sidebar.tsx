"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { $fetch } from "@/lib/api";

interface RateEntry {
  pair: string;
  flag: string;
  price: string;
  rate: number;
}

const CRYPTO_PAIRS = [
  { from: "BTC", to: "BRL", toType: "FIAT", flag: "🇧🇷" },
  { from: "ETH", to: "BRL", toType: "FIAT", flag: "🇧🇷" },
  { from: "USDT", to: "BRL", toType: "FIAT", flag: "🇧🇷" },
  { from: "SOL", to: "BRL", toType: "FIAT", flag: "🇧🇷" },
];

const OTHER_CURRENCIES = [
  { currency: "ARS", flag: "🇦🇷" },
  { currency: "COP", flag: "🇨🇴" },
  { currency: "CLP", flag: "🇨🇱" },
  { currency: "PEN", flag: "🇵🇪" },
  { currency: "MXN", flag: "🇲🇽" },
  { currency: "USD", flag: "🇺🇸" },
];

const WHY_CONVERT = [
  "No middlemen — instant at market rate",
  "Direct to your bank in seconds",
  "No scam risk — fully automated",
  "Supports 9+ fiat currencies across LATAM",
];

function formatPrice(rate: number, currency: string): string {
  const symbols: Record<string, string> = {
    BRL: "R$",
    ARS: "$",
    COP: "$",
    CLP: "$",
    PEN: "S/",
    MXN: "$",
    UYU: "$U",
    USD: "$",
    EUR: "€",
    GBP: "£",
  };
  const sym = symbols[currency] || "";

  if (rate >= 1_000_000) {
    return `${sym}${(rate / 1_000_000).toFixed(1)}M`;
  }
  if (rate >= 1_000) {
    return `${sym}${rate.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  }
  return `${sym}${rate.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

export function LiveRatesSidebar() {
  const [brlRates, setBrlRates] = useState<RateEntry[]>([]);
  const [otherRates, setOtherRates] = useState<{ currency: string; flag: string; price: string }[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchRates() {
    setLoading(true);

    const brlResults: RateEntry[] = [];
    for (const pair of CRYPTO_PAIRS) {
      const { data } = await $fetch<{ rate: number }>({
        url: "/api/finance/convert/rate",
        method: "GET",
        params: {
          fromCurrency: pair.from,
          fromType: "SPOT",
          toCurrency: pair.to,
          toType: pair.toType,
        },
        silent: true,
      });
      brlResults.push({
        pair: `${pair.from}/${pair.to}`,
        flag: pair.flag,
        price: data ? formatPrice(data.rate, pair.to) : "—",
        rate: data?.rate || 0,
      });
    }
    setBrlRates(brlResults);

    const otherResults: { currency: string; flag: string; price: string }[] = [];
    for (const c of OTHER_CURRENCIES) {
      const { data } = await $fetch<{ rate: number }>({
        url: "/api/finance/convert/rate",
        method: "GET",
        params: {
          fromCurrency: "BTC",
          fromType: "SPOT",
          toCurrency: c.currency,
          toType: "FIAT",
        },
        silent: true,
      });
      otherResults.push({
        currency: c.currency,
        flag: c.flag,
        price: data ? formatPrice(data.rate, c.currency) : "—",
      });
    }
    setOtherRates(otherResults);
    setLoading(false);
  }

  useEffect(() => {
    fetchRates();
    const interval = setInterval(fetchRates, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      {/* NGN rates */}
      <div className="bg-card dark:bg-[#161B22] border border-border dark:border-[rgba(230,237,243,0.06)] p-4">
        <div className="flex justify-between items-center mb-4">
          <span className="font-extrabold text-sm">Live Rates (BRL)</span>
          <span className="text-[11px] text-muted-foreground">
            Updates every 30s
          </span>
        </div>
        {loading && !brlRates.length ? (
          <div className="flex items-center justify-center py-4 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Loading rates...
          </div>
        ) : (
          <div className="flex flex-col">
            {brlRates.map((rate) => (
              <div
                key={rate.pair}
                className="grid grid-cols-2 gap-2 py-2.5 border-b border-border/50 last:border-b-0 text-sm items-center tabular-nums"
              >
                <div className="flex items-center gap-2 font-semibold">
                  <div className="w-6 h-6 flex items-center justify-center bg-[var(--quatava-blue-100)] dark:bg-[rgba(51,117,187,0.12)] text-[13px]">
                    {rate.flag}
                  </div>
                  {rate.pair}
                </div>
                <span className="font-semibold text-right">{rate.price}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Other currencies */}
      <div className="bg-card dark:bg-[#161B22] border border-border dark:border-[rgba(230,237,243,0.06)] p-4">
        <div className="flex justify-between items-center mb-4">
          <span className="font-extrabold text-sm">BTC in Other Currencies</span>
        </div>
        {loading && !otherRates.length ? (
          <div className="flex items-center justify-center py-4 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Loading...
          </div>
        ) : (
          <div className="flex flex-col">
            {otherRates.map((rate) => (
              <div
                key={rate.currency}
                className="grid grid-cols-2 gap-2 py-2.5 border-b border-border/50 last:border-b-0 text-sm items-center tabular-nums"
              >
                <div className="flex items-center gap-2 font-semibold">
                  <div className="w-6 h-6 flex items-center justify-center bg-[var(--quatava-blue-100)] dark:bg-[rgba(51,117,187,0.12)] text-[13px]">
                    {rate.flag}
                  </div>
                  {rate.currency}
                </div>
                <span className="font-semibold text-right">{rate.price}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Why Convert */}
      <div className="bg-card dark:bg-[#161B22] border border-border dark:border-[rgba(230,237,243,0.06)] p-4">
        <div className="flex justify-between items-center mb-4">
          <span className="font-extrabold text-sm">Why Convert with Quatava?</span>
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
