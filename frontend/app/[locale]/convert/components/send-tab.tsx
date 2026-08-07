"use client";

import { useState } from "react";

const CRYPTO_OPTIONS = [
  { value: "BTC", label: "Bitcoin (BTC)" },
  { value: "ETH", label: "Ethereum (ETH)" },
  { value: "SOL", label: "Solana (SOL)" },
  { value: "USDT", label: "Tether (USDT)" },
  { value: "XRP", label: "Ripple (XRP)" },
];

const NETWORKS: Record<string, string[]> = {
  BTC: ["Bitcoin"],
  ETH: ["Ethereum (ERC-20)", "Arbitrum", "Optimism"],
  SOL: ["Solana"],
  USDT: ["Ethereum (ERC-20)", "Tron (TRC-20)", "Solana"],
  XRP: ["XRP Ledger"],
};

export function SendTab() {
  const [crypto, setCrypto] = useState("BTC");
  const [network, setNetwork] = useState("Bitcoin");
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");

  const availableNetworks = NETWORKS[crypto] ?? [];

  return (
    <div className="max-w-xl">
      <div className="bg-card border border-border p-6">
        <h2 className="font-extrabold text-lg mb-4">Send Crypto</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Send cryptocurrency to an external wallet address.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Asset
            </label>
            <select
              value={crypto}
              onChange={(e) => {
                setCrypto(e.target.value);
                setNetwork(NETWORKS[e.target.value]?.[0] ?? "");
              }}
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
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Network
            </label>
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              className="w-full px-3 py-3 text-sm font-semibold bg-background border border-border text-foreground cursor-pointer focus:border-primary focus:outline-none"
            >
              {availableNetworks.map((net) => (
                <option key={net} value={net}>
                  {net}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Recipient Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter wallet address"
              className="w-full px-3.5 py-3 text-sm bg-background border border-border text-foreground focus:border-primary focus:outline-none font-mono"
            />
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
                {crypto}
              </div>
            </div>
          </div>

          <button className="w-full py-3.5 text-[15px] font-extrabold bg-primary text-white border-none cursor-pointer mt-2 hover:bg-[var(--quatava-blue-600)] transition-colors">
            Send {crypto}
          </button>
        </div>
      </div>
    </div>
  );
}
