"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ArrowUpDown,
  Globe,
  Shield,
  CreditCard,
  Smartphone,
  Wallet,
  Loader2,
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
    rate,
    isLoadingRate,
    feePercentage,
    fee,
    fetchRate,
    executeConversion,
    fetchHistory,
    rateError,
  } = useConvertStore();

  const [elapsedSince, setElapsedSince] = useState(0);
  const rateTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchRate();
    fetchHistory();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchRate();
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [sendCurrency, receiveCurrency, sendAmount]);

  useEffect(() => {
    if (rateTimerRef.current) clearInterval(rateTimerRef.current);
    rateTimerRef.current = setInterval(() => {
      setRateCountdown(rateCountdown > 0 ? rateCountdown - 1 : 30);
      setElapsedSince((prev) => prev + 1);
      if (rateCountdown <= 0) {
        fetchRate();
        setElapsedSince(0);
      }
    }, 1000);
    return () => {
      if (rateTimerRef.current) clearInterval(rateTimerRef.current);
    };
  }, [rateCountdown, setRateCountdown]);

  const handleSwap = useCallback(() => {
    swapCurrencies();
  }, [swapCurrencies]);

  const handleConvert = useCallback(async () => {
    const success = await executeConversion();
    if (success) {
      fetchRate();
    }
  }, [executeConversion, fetchRate]);

  const fiatSymbol =
    FIAT_OPTIONS.find((f) => f.value === receiveCurrency)?.symbol ?? "₦";

  const formatRate = (r: number) => {
    if (!r || r <= 0) return "...";
    if (r >= 1000) {
      return r.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return r.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 8 });
  };

  const parsedSendAmount = parseFloat(sendAmount) || 0;
  const feeAmount = fee || (parsedSendAmount * (feePercentage || 0)) / 100;

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
              {detectedCountry && (
                <div className="flex items-center gap-2 px-3 py-2 bg-[var(--quatava-blue-100)] dark:bg-[rgba(51,117,187,0.1)] text-sm mb-3">
                  <Globe className="w-4 h-4 text-primary shrink-0" />
                  <span>
                    Detected region: <strong>{detectedCountry}</strong> — Showing{" "}
                    {receiveCurrency} rates.
                  </span>
                </div>
              )}

              {/* Convert card */}
              <div className="bg-card dark:bg-[#161B22] border border-border p-6">
                {/* You send */}
                <div className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground mb-2">
                  You send
                </div>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={sendAmount}
                      onChange={(e) => setSendAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3.5 py-3 text-lg font-extrabold bg-background dark:bg-[#21262D] border border-border dark:border-[rgba(230,237,243,0.1)] text-foreground tabular-nums focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="w-40">
                    <select
                      value={sendCurrency}
                      onChange={(e) => setSendCurrency(e.target.value)}
                      className="w-full px-2.5 py-3 text-sm font-semibold bg-background dark:bg-[#21262D] border border-border dark:border-[rgba(230,237,243,0.1)] text-foreground cursor-pointer focus:border-primary focus:outline-none"
                    >
                      {CRYPTO_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                      {FIAT_OPTIONS.map((opt) => (
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
                    className="w-11 h-11 flex items-center justify-center bg-background dark:bg-[#21262D] border-2 border-border dark:border-[rgba(230,237,243,0.1)] text-primary cursor-pointer hover:border-primary transition-transform hover:rotate-180 duration-200"
                  >
                    <ArrowUpDown className="w-5 h-5" />
                  </button>
                </div>

                {/* You receive */}
                <div className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground mb-2">
                  You receive
                </div>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={isLoadingRate ? "..." : receiveAmount}
                      readOnly
                      className="w-full px-3.5 py-3 text-lg font-extrabold bg-[hsl(var(--primary)/0.03)] dark:bg-[rgba(51,117,187,0.06)] border border-border text-foreground tabular-nums"
                    />
                  </div>
                  <div className="w-40">
                    <select
                      value={receiveCurrency}
                      onChange={(e) => setReceiveCurrency(e.target.value)}
                      className="w-full px-2.5 py-3 text-sm font-semibold bg-background dark:bg-[#21262D] border border-border dark:border-[rgba(230,237,243,0.1)] text-foreground cursor-pointer focus:border-primary focus:outline-none"
                    >
                      {FIAT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                      {CRYPTO_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Rate bar */}
                <div className="flex justify-between items-center p-3 mt-3 bg-[var(--quatava-blue-100)] dark:bg-[rgba(51,117,187,0.1)] text-[13px]">
                  <div>
                    <span className="text-muted-foreground">Rate: </span>
                    {isLoadingRate ? (
                      <Loader2 className="w-4 h-4 inline animate-spin text-primary" />
                    ) : rateError ? (
                      <span className="text-destructive text-xs">Unavailable</span>
                    ) : (
                      <span className="font-extrabold tabular-nums">
                        1 {sendCurrency} = {formatRate(rate)} {receiveCurrency}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground/40">
                    {rate > 0 && (
                      <>Updated {elapsedSince}s ago &middot; Refreshes in {rateCountdown}s</>
                    )}
                  </div>
                </div>

                {/* Fee breakdown */}
                {parsedSendAmount > 0 && rate > 0 && (
                  <>
                    <div className="flex justify-between text-xs text-muted-foreground mt-3">
                      <span>Platform fee ({feePercentage}%)</span>
                      <span className="font-semibold">
                        {feeAmount.toLocaleString("en-US", { maximumFractionDigits: 8 })} {sendCurrency}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-bold mt-2 pt-2 border-t border-border">
                      <span>You receive</span>
                      <span className="text-success font-extrabold tabular-nums">
                        {receiveAmount} {receiveCurrency}
                      </span>
                    </div>
                  </>
                )}

                {/* Convert button */}
                <button
                  onClick={handleConvert}
                  disabled={isConverting || isLoadingRate || !sendAmount || !rate}
                  className="w-full py-3.5 text-[15px] font-extrabold bg-success text-white border-none cursor-pointer mt-4 hover:bg-[#059669] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isConverting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Converting...
                    </span>
                  ) : sendAmount && rate ? (
                    `Convert ${sendAmount} ${sendCurrency} → ${receiveCurrency}`
                  ) : (
                    "Enter amount to convert"
                  )}
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
                    const selected = paymentMethod === method.key;
                    return (
                      <button
                        key={method.key}
                        onClick={() => setPaymentMethod(method.key)}
                        className={`p-3 flex items-center gap-3 border-2 cursor-pointer transition-colors text-left ${
                          selected
                            ? "border-primary bg-[var(--quatava-blue-100)] dark:bg-[rgba(51,117,187,0.08)]"
                            : "border-border bg-card dark:bg-[#161B22] hover:border-[var(--quatava-blue-300)] dark:hover:bg-[#21262D]"
                        }`}
                      >
                        <div className="w-10 h-10 flex items-center justify-center bg-[var(--quatava-blue-100)] dark:bg-[rgba(51,117,187,0.15)] text-primary shrink-0">
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
                <div className="bg-card dark:bg-[#161B22] border border-border p-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-extrabold text-sm">
                      Bank Details {detectedCountry && `— ${detectedCountry}`}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground">
                        Bank Name
                      </label>
                      <select
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full px-3 py-2.5 text-[13px] bg-background dark:bg-[#21262D] border border-border dark:border-[rgba(230,237,243,0.1)] text-foreground cursor-pointer focus:border-primary focus:outline-none"
                      >
                        <option value="">Select bank</option>
                        {NIGERIAN_BANKS.map((bank) => (
                          <option key={bank} value={bank}>
                            {bank}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground">
                        Account Number
                      </label>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="Enter account number"
                        className="w-full px-3 py-2.5 text-[13px] bg-background dark:bg-[#21262D] border border-border dark:border-[rgba(230,237,243,0.1)] text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1 sm:col-span-2">
                      <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground">
                        Account Name
                      </label>
                      <input
                        type="text"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        readOnly
                        placeholder="Auto-populated after verification"
                        className="w-full px-3 py-2.5 text-[13px] bg-[hsl(var(--primary)/0.03)] dark:bg-[rgba(51,117,187,0.06)] border border-border text-foreground"
                      />
                    </div>
                  </div>
                  <div className="mt-3 text-[11px] text-muted-foreground flex items-start gap-1">
                    <Shield className="w-3 h-3 mt-0.5 shrink-0" />
                    Your bank details are encrypted and only used for this
                    conversion.
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
