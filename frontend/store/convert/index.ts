import { create } from "zustand";

export type PaymentMethod = "bank" | "mobile_money" | "wallet";
export type ConvertTab = "convert" | "buy" | "send" | "withdraw";

interface ConvertState {
  activeTab: ConvertTab;
  sendAmount: string;
  sendCurrency: string;
  receiveCurrency: string;
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
  networkFee: string;
  platformFeePercent: number;
  recentConversions: ConversionRecord[];

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
}

export interface ConversionRecord {
  id: string;
  type: "convert" | "buy" | "send";
  description: string;
  destination: string;
  date: string;
  status: "completed" | "pending" | "failed";
}

export const useConvertStore = create<ConvertState>((set) => ({
  activeTab: "convert",
  sendAmount: "1.0000",
  sendCurrency: "BTC",
  receiveCurrency: "NGN",
  receiveAmount: "104,630,975.00",
  rate: 104630975,
  rateLastUpdated: Date.now(),
  rateCountdown: 30,
  paymentMethod: "bank",
  detectedCountry: "Nigeria",
  detectedCurrencyCode: "NGN",
  bankName: "Access Bank",
  accountNumber: "",
  accountName: "",
  isConverting: false,
  isLoadingRate: false,
  networkFee: "0.0001 BTC",
  platformFeePercent: 0.1,
  recentConversions: [
    {
      id: "1",
      type: "convert",
      description: "0.5 BTC → ₦52,315,487",
      destination: "Access Bank ••89",
      date: "Jul 22, 2026",
      status: "completed",
    },
    {
      id: "2",
      type: "buy",
      description: "2,000 USDT via Card",
      destination: "Visa ••4521",
      date: "Jul 21, 2026",
      status: "completed",
    },
    {
      id: "3",
      type: "send",
      description: "0.25 ETH → 0x8f2…3a1",
      destination: "External wallet",
      date: "Jul 20, 2026",
      status: "completed",
    },
    {
      id: "4",
      type: "convert",
      description: "1,500 USDT → £972.45",
      destination: "Barclays ••12",
      date: "Jul 19, 2026",
      status: "pending",
    },
  ],

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSendAmount: (amount) => set({ sendAmount: amount }),
  setSendCurrency: (currency) => set({ sendCurrency: currency }),
  setReceiveCurrency: (currency) => set({ receiveCurrency: currency }),
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
      sendAmount: state.receiveAmount,
      receiveAmount: state.sendAmount,
    })),
}));
