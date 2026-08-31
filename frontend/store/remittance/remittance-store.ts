import { create } from "zustand";
import { $fetch } from "@/lib/api";

export interface Remittance {
  id: string;
  senderId: string;
  recipientName: string;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientBank?: string;
  recipientAccount?: string;
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
  fee: number;
  rate: number;
  fromCountry: string;
  toCountry: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";
  createdAt: string;
}

interface RemittanceState {
  remittances: Remittance[];
  isLoading: boolean;
  isSending: boolean;
  currentRate: number | null;
  estimatedFee: number | null;

  fetchRemittances: () => Promise<void>;
  getQuote: (data: {
    fromCurrency: string;
    toCurrency: string;
    amount: number;
    fromCountry: string;
    toCountry: string;
  }) => Promise<{ rate: number; fee: number; toAmount: number } | null>;
  sendRemittance: (data: {
    recipientName: string;
    recipientEmail?: string;
    recipientPhone?: string;
    recipientBank: string;
    recipientAccount: string;
    fromCurrency: string;
    toCurrency: string;
    fromAmount: number;
    fromCountry: string;
    toCountry: string;
  }) => Promise<{ success: boolean; error?: string }>;
}

export const useRemittanceStore = create<RemittanceState>((set, get) => ({
  remittances: [],
  isLoading: false,
  isSending: false,
  currentRate: null,
  estimatedFee: null,

  fetchRemittances: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await $fetch({
        url: "/api/finance/remittance",
        silent: true,
      });
      if (!error && data) {
        set({ remittances: Array.isArray(data) ? data : [] });
      }
    } catch (err) {
      console.error("Error fetching remittances:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  getQuote: async (quoteData) => {
    try {
      const { data, error } = await $fetch({
        url: "/api/finance/remittance/quote",
        method: "POST",
        body: quoteData,
        silent: true,
      });
      if (!error && data) {
        set({ currentRate: data.rate, estimatedFee: data.fee });
        return data;
      }
      return null;
    } catch {
      return null;
    }
  },

  sendRemittance: async (remitData) => {
    set({ isSending: true });
    try {
      const { data, error } = await $fetch({
        url: "/api/finance/remittance",
        method: "POST",
        body: remitData,
      });
      if (!error && data) {
        set({ remittances: [data, ...get().remittances] });
        return { success: true };
      }
      return { success: false, error: error || "Failed to send" };
    } catch {
      return { success: false, error: "Failed to send remittance" };
    } finally {
      set({ isSending: false });
    }
  },
}));
