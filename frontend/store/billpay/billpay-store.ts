import { create } from "zustand";
import { $fetch } from "@/lib/api";

export interface BillCategory {
  id: string;
  name: string;
  icon: string;
  providers: BillProvider[];
}

export interface BillProvider {
  id: string;
  name: string;
  categoryId: string;
  country: string;
  logo?: string;
  minAmount: number;
  maxAmount: number;
}

export interface BillPayment {
  id: string;
  userId: string;
  providerId: string;
  providerName: string;
  category: string;
  accountNumber: string;
  amount: number;
  currency: string;
  cryptoAmount: number;
  cryptoCurrency: string;
  fee: number;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  createdAt: string;
}

interface BillPayState {
  categories: BillCategory[];
  payments: BillPayment[];
  isLoading: boolean;
  isPaying: boolean;

  fetchCategories: (country: string) => Promise<void>;
  fetchPayments: () => Promise<void>;
  payBill: (data: {
    providerId: string;
    accountNumber: string;
    amount: number;
    currency: string;
    payWithCurrency: string;
  }) => Promise<{ success: boolean; error?: string }>;
}

export const useBillPayStore = create<BillPayState>((set, get) => ({
  categories: [],
  payments: [],
  isLoading: false,
  isPaying: false,

  fetchCategories: async (country) => {
    set({ isLoading: true });
    try {
      const { data, error } = await $fetch({
        url: "/api/finance/billpay/categories",
        params: { country },
        silent: true,
      });
      if (!error && data) {
        set({ categories: Array.isArray(data) ? data : [] });
      }
    } catch (err) {
      console.error("Error fetching bill categories:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchPayments: async () => {
    try {
      const { data, error } = await $fetch({
        url: "/api/finance/billpay",
        silent: true,
      });
      if (!error && data) {
        set({ payments: Array.isArray(data) ? data : [] });
      }
    } catch (err) {
      console.error("Error fetching bill payments:", err);
    }
  },

  payBill: async (payData) => {
    set({ isPaying: true });
    try {
      const { data, error } = await $fetch({
        url: "/api/finance/billpay",
        method: "POST",
        body: payData,
      });
      if (!error && data) {
        set({ payments: [data, ...get().payments] });
        return { success: true };
      }
      return { success: false, error: error || "Payment failed" };
    } catch {
      return { success: false, error: "Payment failed" };
    } finally {
      set({ isPaying: false });
    }
  },
}));
