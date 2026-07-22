"use client";

import { useState } from "react";
import { Shield } from "lucide-react";

const FIAT_OPTIONS = [
  { value: "NGN", label: "Nigerian Naira (NGN)", symbol: "₦" },
  { value: "USD", label: "US Dollar (USD)", symbol: "$" },
  { value: "EUR", label: "Euro (EUR)", symbol: "€" },
  { value: "GBP", label: "British Pound (GBP)", symbol: "£" },
];

const BANKS_BY_CURRENCY: Record<string, string[]> = {
  NGN: ["Access Bank", "GTBank", "First Bank", "UBA", "Zenith Bank", "Kuda Bank", "OPay"],
  USD: ["Chase", "Bank of America", "Wells Fargo", "Citibank"],
  EUR: ["Deutsche Bank", "BNP Paribas", "ING", "Revolut"],
  GBP: ["Barclays", "HSBC", "Lloyds", "NatWest", "Monzo"],
};

export function WithdrawTab() {
  const [currency, setCurrency] = useState("NGN");
  const [amount, setAmount] = useState("");
  const [bank, setBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  const banks = BANKS_BY_CURRENCY[currency] ?? [];
  const fiat = FIAT_OPTIONS.find((f) => f.value === currency);

  return (
    <div className="max-w-xl">
      <div className="bg-card border border-border p-6">
        <h2 className="font-extrabold text-lg mb-4">Withdraw to Bank</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Withdraw your fiat balance directly to your bank account.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => {
                setCurrency(e.target.value);
                setBank("");
              }}
              className="w-full px-3 py-3 text-sm font-semibold bg-background border border-border text-foreground cursor-pointer focus:border-primary focus:outline-none"
            >
              {FIAT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Amount
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1 px-3.5 py-3 text-lg font-extrabold bg-background border border-border text-foreground tabular-nums focus:border-primary focus:outline-none"
              />
              <div className="flex items-center px-4 bg-card border border-border text-sm font-semibold text-muted-foreground">
                {fiat?.symbol} {currency}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Bank Name
              </label>
              <select
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-background border border-border text-foreground cursor-pointer focus:border-primary focus:outline-none"
              >
                <option value="">Select bank</option>
                {banks.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Account Number
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Enter account number"
                className="w-full px-3 py-2.5 text-sm bg-background border border-border text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Account Name
              </label>
              <input
                type="text"
                value={accountName}
                readOnly
                placeholder="Auto-populated after verification"
                className="w-full px-3 py-2.5 text-sm bg-[hsl(var(--primary)/0.03)] border border-border text-foreground"
              />
            </div>
          </div>

          <div className="text-[11px] text-muted-foreground flex items-start gap-1">
            <Shield className="w-3 h-3 mt-0.5 shrink-0" />
            Your bank details are encrypted and stored securely.
          </div>

          <button className="w-full py-3.5 text-[15px] font-extrabold bg-success text-white border-none cursor-pointer mt-2 hover:bg-[#059669] transition-colors">
            Withdraw {fiat?.symbol}{amount || "0.00"} to Bank
          </button>
        </div>
      </div>
    </div>
  );
}
