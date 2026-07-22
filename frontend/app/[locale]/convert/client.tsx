"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowUpDown,
  Globe,
  Shield,
  Check,
  CreditCard,
  Smartphone,
  Wallet,
} from "lucide-react";
import { useConvertStore, type ConvertTab, type PaymentMethod } from "@/store/convert";
import { LiveRatesSidebar } from "./components/live-rates-sidebar";
import { RecentConversions } from "./components/recent-conversions";
import { BuyCryptoTab } from "./components/buy-crypto-tab";
import { SendTab } from "./components/send-tab";
import { WithdrawTab } from "./components/withdraw-tab";

const CRYPTO_OPTIONS = [
  { value: "BTC", label: "BTC — Bitcoin", symbol: "BTC" },
  { value: "ETH", label: "ETH — Ethereum", symbol: "ETH" },
  { value: "SOL", label: "SOL — Solana", symbol: "SOL" },
  { value: "USDT", label: "USDT — Tether", symbol: "USDT" },
  { value: "XRP", label: "XRP — Ripple", symbol: "XRP" },
];

const FIAT_OPTIONS = [
  { value: "NGN", label: "NGN — Naira", symbol: "₦", flag: "🇳🇬" },
  { value: "USD", label: "USD — US Dollar", symbol: "$", flag: "🇺🇸" },
  { value: "EUR", label: "EUR — Euro", symbol: "€", flag: "🇪🇺" },
  { value: "GBP", label: "GBP — Pound", symbol: "£", flag: "🇬🇧" },
  { value: "MXN", label: "MXN — Peso", symbol: "$", flag: "🇲🇽" },
  { value: "AED", label: "AED — Dirham", symbol: "د.إ", flag: "🇦🇪" },
];

const NIGERIAN_BANKS = [
  "Access Bank",
  "GTBank",
  "First Bank",
  "UBA",
  "Zenith Bank",
  "Kuda Bank",
  "OPay",
];

const TABS: { key: ConvertTab; label: string }[] = [
  { key: "convert", label: "Convert" },
  { key: "buy", label: "Buy Crypto" },
  { key: "send", label: "Send" },
  { key: "withdraw", label: "Withdraw to Bank" },
];

const PAYMENT_METHODS: {
  key: PaymentMethod;
  name: string;
  desc: string;
  fee: string;
  icon: typeof CreditCard;
}[] = [
  {
    key: "bank",
    name: "Bank Account",
    desc: "Direct to your bank",
    fee: "Instant · Free",
    icon: CreditCard,
  },
  {
    key: "mobile_money",
    name: "Mobile Money",
    desc: "MTN, Airtel, etc.",
    fee: "~2 min · Free",
    icon: Smartphone,
  },
  {
    key: "wallet",
    name: "Quatava Wallet",
    desc: "Keep as fiat balance",
    fee: "Instant · Free",
    icon: Wallet,
  },
];

export default function ConvertClient() {
  const {
    activeTab,
    setActiveTab,
    sendAmount,
    setSendAmount,
    sendCurrency,
    setSendCurrency,
    receiveCurrency,
    setReceiveCurrency,
    receiveAmount,
    paymentMethod,
    setPaymentMethod,
    detectedCountry,
    bankName,
    setBankName,
    accountNumber,
    setAccountNumber,
    accountName,
    setAccountName,
    isConverting,
    swapCurrencies,
    rateCountdown,
    setRateCountdown,
  } = useConvertStore();

  const [elapsedSince, setElapsedSince] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setRateCountdown(rateCountdown > 0 ? rateCountdown - 1 : 30);
      setElapsedSince((prev) => (prev < 30 ? prev + 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [rateCountdown, setRateCountdown]);

  const handleSwap = useCallback(() => {
    swapCurrencies();
  }, [swapCurrencies]);

  const fiatSymbol =
    FIAT_OPTIONS.find((f) => f.value === receiveCurrency)?.symbol ?? "₦";

  const formatRate = (rate: number) => {
    return rate.toLocaleString("en-US", { minimumFractionDigits: 2 });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-extrabold tracking-tight font-[var(--font-archivo)]">
          Convert
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b-2 border-border mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 text-sm font-extrabold border-b-2 -mb-[2px] transition-colors bg-transparent border-t-0 border-l-0 border-r-0 cursor-pointer ${
              activeTab === tab.key
                ? "text-primary border-b-primary"
                : "text-muted-foreground border-b-transparent hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "convert" && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
            {/* Main convert form */}
            <div>
              {/* Country auto-detect banner */}
              <div className="flex items-center gap-2 px-3 py-2 bg-[hsl(var(--primary)/0.08)] text-sm mb-3">
                <Globe className="w-4 h-4 text-primary shrink-0" />
                <span>
                  Detected region: <strong>{detectedCountry}</strong> — Showing{" "}
                  {receiveCurrency} rates.{" "}
                  <a href="#" className="text-primary font-semibold ml-1">
                    Change →
                  </a>
                </span>
              </div>

              {/* Convert card */}
              <div className="bg-card border border-border p-6">
                {/* You send */}
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  You send
                </div>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={sendAmount}
                      onChange={(e) => setSendAmount(e.target.value)}
                      className="w-full px-3.5 py-3 text-lg font-extrabold bg-background border border-border text-foreground tabular-nums focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="w-40">
                    <select
                      value={sendCurrency}
                      onChange={(e) => setSendCurrency(e.target.value)}
                      className="w-full px-2.5 py-3 text-sm font-semibold bg-background border border-border text-foreground cursor-pointer focus:border-primary focus:outline-none"
                    >
                      {CRYPTO_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Swap button */}
                <div className="flex justify-center py-3">
                  <button
                    onClick={handleSwap}
                    className="w-11 h-11 flex items-center justify-center bg-background border-2 border-border text-primary cursor-pointer hover:border-primary transition-transform hover:rotate-180 duration-200"
                  >
                    <ArrowUpDown className="w-5 h-5" />
                  </button>
                </div>

                {/* You receive */}
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  You receive
                </div>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={receiveAmount}
                      readOnly
                      className="w-full px-3.5 py-3 text-lg font-extrabold bg-[hsl(var(--primary)/0.03)] border border-border text-foreground tabular-nums"
                    />
                  </div>
                  <div className="w-40">
                    <select
                      value={receiveCurrency}
                      onChange={(e) => setReceiveCurrency(e.target.value)}
                      className="w-full px-2.5 py-3 text-sm font-semibold bg-background border border-border text-foreground cursor-pointer focus:border-primary focus:outline-none"
                    >
                      {FIAT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Rate bar */}
                <div className="flex justify-between items-center p-3 mt-3 bg-[hsl(var(--primary)/0.08)] text-sm">
                  <div>
                    <span className="text-muted-foreground">Rate: </span>
                    <span className="font-extrabold tabular-nums">
                      1 {sendCurrency} = {fiatSymbol}
                      {formatRate(104630975)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Updated {elapsedSince}s ago · Refreshes in {rateCountdown}s
                  </div>
                </div>

                {/* Fee breakdown */}
                <div className="flex justify-between text-xs text-muted-foreground mt-3">
                  <span>Network fee</span>
                  <span className="font-semibold">
                    0.0001 BTC (~{fiatSymbol}10,463)
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Platform fee (0.1%)</span>
                  <span className="font-semibold">{fiatSymbol}104,631</span>
                </div>
                <div className="flex justify-between text-sm font-bold mt-2 pt-2 border-t border-border">
                  <span>You receive</span>
                  <span className="text-success font-extrabold tabular-nums">
                    {fiatSymbol}104,515,881.00
                  </span>
                </div>

                {/* Convert button */}
                <button
                  disabled={isConverting}
                  className="w-full py-3.5 text-[15px] font-extrabold bg-success text-white border-none cursor-pointer mt-4 hover:bg-[#059669] disabled:opacity-50 transition-colors"
                >
                  {isConverting
                    ? "Converting..."
                    : `Convert ${sendAmount} ${sendCurrency} → ${receiveCurrency}`}
                </button>
              </div>

              {/* Payment method selector */}
              <div className="mt-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Receive funds to
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  {PAYMENT_METHODS.map((method) => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.key}
                        onClick={() => setPaymentMethod(method.key)}
                        className={`p-3 flex items-center gap-3 border-2 cursor-pointer transition-colors text-left ${
                          paymentMethod === method.key
                            ? "border-primary bg-[hsl(var(--primary)/0.06)]"
                            : "border-border bg-card hover:border-[hsl(var(--primary)/0.3)]"
                        }`}
                      >
                        <div className="w-10 h-10 flex items-center justify-center bg-[hsl(var(--primary)/0.08)] text-primary shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-extrabold text-[13px]">
                            {method.name}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {method.desc}
                          </div>
                          <div className="text-[10px] text-success font-semibold mt-0.5">
                            {method.fee}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bank details form */}
              {paymentMethod === "bank" && (
                <div className="bg-card border border-border p-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-extrabold text-sm">
                      Bank Details — {detectedCountry} 🇳🇬
                    </span>
                    <span className="text-[11px] text-success font-semibold">
                      ✓ Auto-detected
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Bank Name
                      </label>
                      <select
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm bg-background border border-border text-foreground cursor-pointer focus:border-primary focus:outline-none"
                      >
                        {NIGERIAN_BANKS.map((bank) => (
                          <option key={bank} value={bank}>
                            {bank}
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
                        onChange={(e) => setAccountName(e.target.value)}
                        readOnly
                        placeholder="Auto-populated after verification"
                        className="w-full px-3 py-2.5 text-sm bg-[hsl(var(--primary)/0.03)] border border-border text-foreground"
                      />
                    </div>
                  </div>
                  <div className="mt-3 text-[11px] text-muted-foreground flex items-start gap-1">
                    <Shield className="w-3 h-3 mt-0.5 shrink-0" />
                    Your bank details are encrypted and only used for this
                    conversion. You can save them for future use.
                  </div>
                </div>
              )}
            </div>

            {/* Right sidebar: live rates */}
            <LiveRatesSidebar />
          </div>

          {/* Recent conversions */}
          <RecentConversions />
        </>
      )}

      {activeTab === "buy" && <BuyCryptoTab />}
      {activeTab === "send" && <SendTab />}
      {activeTab === "withdraw" && <WithdrawTab />}
    </div>
  );
}
