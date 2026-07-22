"use client";

import { useState } from "react";
import { CreditCard, Building2 } from "lucide-react";

const CRYPTO_OPTIONS = [
  { value: "BTC", label: "Bitcoin (BTC)" },
  { value: "ETH", label: "Ethereum (ETH)" },
  { value: "SOL", label: "Solana (SOL)" },
  { value: "USDT", label: "Tether (USDT)" },
  { value: "XRP", label: "Ripple (XRP)" },
];

export function BuyCryptoTab() {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [crypto, setCrypto] = useState("BTC");
  const [payMethod, setPayMethod] = useState<"card" | "bank">("card");

  return (
    <div className="max-w-2xl">
      <div className="bg-card border border-border p-6">
        <h2 className="font-extrabold text-lg mb-4">Buy Crypto</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Purchase cryptocurrency using your local currency via card or bank
          transfer.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
              I want to spend
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1 px-3.5 py-3 text-lg font-extrabold bg-background border border-border text-foreground tabular-nums focus:border-primary focus:outline-none"
              />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-32 px-2.5 py-3 text-sm font-semibold bg-background border border-border text-foreground cursor-pointer focus:border-primary focus:outline-none"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="NGN">NGN</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
              I want to buy
            </label>
            <select
              value={crypto}
              onChange={(e) => setCrypto(e.target.value)}
              className="w-full px-3 py-3 text-sm font-semibold bg-background border border-border text-foreground cursor-pointer focus:border-primary focus:outline-none"
            >
              {CRYPTO_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
              Payment method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPayMethod("card")}
                className={`p-3 flex items-center gap-3 border-2 cursor-pointer text-left ${
                  payMethod === "card"
                    ? "border-primary bg-[hsl(var(--primary)/0.06)]"
                    : "border-border bg-card hover:border-[hsl(var(--primary)/0.3)]"
                }`}
              >
                <CreditCard className="w-5 h-5 text-primary" />
                <div>
                  <div className="font-extrabold text-[13px]">
                    Credit/Debit Card
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Visa, Mastercard
                  </div>
                </div>
              </button>
              <button
                onClick={() => setPayMethod("bank")}
                className={`p-3 flex items-center gap-3 border-2 cursor-pointer text-left ${
                  payMethod === "bank"
                    ? "border-primary bg-[hsl(var(--primary)/0.06)]"
                    : "border-border bg-card hover:border-[hsl(var(--primary)/0.3)]"
                }`}
              >
                <Building2 className="w-5 h-5 text-primary" />
                <div>
                  <div className="font-extrabold text-[13px]">
                    Bank Transfer
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Direct bank
                  </div>
                </div>
              </button>
            </div>
          </div>

          <button className="w-full py-3.5 text-[15px] font-extrabold bg-primary text-white border-none cursor-pointer mt-2 hover:bg-[var(--quatava-blue-600)] transition-colors">
            Buy {crypto}
          </button>
        </div>
      </div>
    </div>
  );
}
