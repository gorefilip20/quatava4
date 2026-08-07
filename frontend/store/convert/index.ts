import { create } from "zustand";
import { $fetch } from "@/lib/api";

export type PaymentMethod = "bank" | "mobile_money" | "wallet";
export type ConvertTab = "convert" | "buy" | "send" | "withdraw";

export interface ConversionRecord {
  id: string;
  type: "convert" | "buy" | "send";
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
  rate: number;
  fee: number;
  status: "COMPLETED" | "PENDING" | "FAILED" | "completed" | "pending" | "failed";
  createdAt: string;
  description?: string;
  destination?: string;
  date?: string;
}

interface RateQuote {
  rate: number;
  fromPriceUSD: number;
  toPriceUSD: number;
  feePercentage: number;
  fee: number;
  estimatedReceive: number;
}

interface ConvertState {
  activeTab: ConvertTab;
  sendAmount: string;
  sendCurrency: string;
  sendType: "SPOT" | "FIAT";
  receiveCurrency: string;
  receiveType: "SPOT" | "FIAT";
  receiveAmount: string;
  rate: number;
  rateLastUpdated: number;
  rateCountdown: number;
  paymentMethod: PaymentMethod;
  detectedCountry: string;
  detectedCurrencyCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isConverting: boolean;
  isLoadingRate: boolean;
  feePercentage: number;
  fee: number;
  recentConversions: ConversionRecord[];
  isLoadingHistory: boolean;
  rateError: string | null;
  convertError: string | null;

  setActiveTab: (tab: ConvertTab) => void;
  setSendAmount: (amount: string) => void;
  setSendCurrency: (currency: string) => void;
  setReceiveCurrency: (currency: string) => void;
  setReceiveAmount: (amount: string) => void;
  setRate: (rate: number) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setBankName: (name: string) => void;
  setAccountNumber: (number: string) => void;
  setAccountName: (name: string) => void;
  setIsConverting: (converting: boolean) => void;
  setIsLoadingRate: (loading: boolean) => void;
  setRateCountdown: (countdown: number) => void;
  setDetectedCountry: (country: string, currencyCode: string) => void;
  swapCurrencies: () => void;
  fetchRate: () => Promise<RateQuote | null>;
  executeConversion: () => Promise<boolean>;
  fetchHistory: () => Promise<void>;
}

const FIAT_CURRENCIES = ["BRL", "ARS", "COP", "CLP", "PEN", "MXN", "UYU", "USD", "EUR", "GBP", "NGN", "AED", "KES", "GHS", "ZAR", "INR", "JPY", "CNY"];

function inferWalletType(currency: string): "SPOT" | "FIAT" {
  return FIAT_CURRENCIES.includes(currency.toUpperCase()) ? "FIAT" : "SPOT";
}

export const useConvertStore = create<ConvertState>((set, get) => ({
  activeTab: "convert",
  sendAmount: "",
  sendCurrency: "BTC",
  sendType: "SPOT",
  receiveCurrency: "BRL",
  receiveType: "FIAT",
  receiveAmount: "",
  rate: 0,
  rateLastUpdated: 0,
  rateCountdown: 30,
  paymentMethod: "wallet",
  detectedCountry: "",
  detectedCurrencyCode: "",
  bankName: "",
  accountNumber: "",
  accountName: "",
  isConverting: false,
  isLoadingRate: false,
  feePercentage: 0,
  fee: 0,
  recentConversions: [],
  isLoadingHistory: false,
  rateError: null,
  convertError: null,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSendAmount: (amount) => set({ sendAmount: amount }),
  setSendCurrency: (currency) =>
    set({ sendCurrency: currency, sendType: inferWalletType(currency) }),
  setReceiveCurrency: (currency) =>
    set({ receiveCurrency: currency, receiveType: inferWalletType(currency) }),
  setReceiveAmount: (amount) => set({ receiveAmount: amount }),
  setRate: (rate) => set({ rate, rateLastUpdated: Date.now() }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setBankName: (name) => set({ bankName: name }),
  setAccountNumber: (number) => set({ accountNumber: number }),
  setAccountName: (name) => set({ accountName: name }),
  setIsConverting: (converting) => set({ isConverting: converting }),
  setIsLoadingRate: (loading) => set({ isLoadingRate: loading }),
  setRateCountdown: (countdown) => set({ rateCountdown: countdown }),
  setDetectedCountry: (country, currencyCode) =>
    set({ detectedCountry: country, detectedCurrencyCode: currencyCode }),
  swapCurrencies: () =>
    set((state) => ({
      sendCurrency: state.receiveCurrency,
      receiveCurrency: state.sendCurrency,
      sendType: state.receiveType,
      receiveType: state.sendType,
      sendAmount: state.receiveAmount,
      receiveAmount: state.sendAmount,
    })),

  fetchRate: async () => {
    const { sendCurrency, sendType, receiveCurrency, receiveType, sendAmount } = get();
    if (!sendCurrency || !receiveCurrency) return null;

    set({ isLoadingRate: true, rateError: null });

    const params: Record<string, string | number | boolean> = {
      fromCurrency: sendCurrency,
      fromType: sendType,
      toCurrency: receiveCurrency,
      toType: receiveType,
    };

    const parsedAmount = parseFloat(sendAmount);
    if (!isNaN(parsedAmount) && parsedAmount > 0) {
      params.amount = parsedAmount;
    }

    const { data, error } = await $fetch<RateQuote>({
      url: "/api/finance/convert/rate",
      method: "GET",
      params,
      silent: true,
    });

    if (error || !data) {
      set({ isLoadingRate: false, rateError: error || "Failed to fetch rate" });
      return null;
    }

    set({
      rate: data.rate,
      feePercentage: data.feePercentage,
      fee: data.fee,
      receiveAmount: data.estimatedReceive > 0
        ? data.estimatedReceive.toLocaleString("en-US", { maximumFractionDigits: 8 })
        : "",
      rateLastUpdated: Date.now(),
      rateCountdown: 30,
      isLoadingRate: false,
      rateError: null,
    });

    return data;
  },

  executeConversion: async () => {
    const { sendCurrency, sendType, receiveCurrency, receiveType, sendAmount } = get();
    const parsedAmount = parseFloat(sendAmount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      set({ convertError: "Enter a valid amount" });
      return false;
    }

    set({ isConverting: true, convertError: null });

    const { data, error } = await $fetch<{
      message: string;
      fromAmount: number;
      toAmount: number;
      rate: number;
      fee: number;
    }>({
      url: "/api/finance/convert",
      method: "POST",
      body: {
        fromCurrency: sendCurrency,
        fromType: sendType,
        toCurrency: receiveCurrency,
        toType: receiveType,
        amount: parsedAmount,
      },
      successMessage: (d) =>
        `Converted ${d.fromAmount} ${sendCurrency} to ${d.toAmount.toFixed(8)} ${receiveCurrency}`,
    });

    if (error || !data) {
      set({ isConverting: false, convertError: error || "Conversion failed" });
      return false;
    }

    set({
      isConverting: false,
      sendAmount: "",
      receiveAmount: "",
      convertError: null,
    });

    get().fetchHistory();
    return true;
  },

  fetchHistory: async () => {
    set({ isLoadingHistory: true });

    const { data, error } = await $fetch<{
      data: ConversionRecord[];
      pagination: any;
    }>({
      url: "/api/finance/convert/history",
      method: "GET",
      params: { perPage: 10, sortOrder: "DESC" },
      silent: true,
    });

    if (data?.data) {
      set({ recentConversions: data.data, isLoadingHistory: false });
    } else {
      set({ isLoadingHistory: false });
    }
  },
}));
