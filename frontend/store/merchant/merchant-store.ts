import { create } from "zustand";
import { $fetch } from "@/lib/api";

export interface MerchantProfile {
  id: string;
  userId: string;
  businessName: string;
  businessType: string;
  website?: string;
  apiKey: string;
  secretKey: string;
  webhookUrl?: string;
  settlementCurrency: string;
  autoSettle: boolean;
  totalReceived: number;
  totalTransactions: number;
  status: "ACTIVE" | "PENDING" | "SUSPENDED";
  createdAt: string;
}

export interface MerchantTransaction {
  id: string;
  merchantId: string;
  orderId: string;
  customerEmail?: string;
  amount: number;
  currency: string;
  cryptoAmount: number;
  cryptoCurrency: string;
  settled: boolean;
  settledAmount?: number;
  status: "PENDING" | "CONFIRMED" | "SETTLED" | "EXPIRED" | "REFUNDED";
  createdAt: string;
}

interface MerchantState {
  profile: MerchantProfile | null;
  transactions: MerchantTransaction[];
  isLoading: boolean;
  isSaving: boolean;

  fetchProfile: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  createProfile: (data: {
    businessName: string;
    businessType: string;
    website?: string;
    settlementCurrency: string;
  }) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (data: Partial<MerchantProfile>) => Promise<{ success: boolean }>;
  regenerateKeys: () => Promise<{ apiKey: string; secretKey: string } | null>;
}

export const useMerchantStore = create<MerchantState>((set, get) => ({
  profile: null,
  transactions: [],
  isLoading: false,
  isSaving: false,

  fetchProfile: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await $fetch({
        url: "/api/finance/merchant/profile",
        silent: true,
      });
      if (!error && data) {
        set({ profile: data });
      }
    } catch (err) {
      console.error("Error fetching merchant profile:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchTransactions: async () => {
    try {
      const { data, error } = await $fetch({
        url: "/api/finance/merchant/transactions",
        silent: true,
      });
      if (!error && data) {
        set({ transactions: Array.isArray(data) ? data : [] });
      }
    } catch (err) {
      console.error("Error fetching merchant transactions:", err);
    }
  },

  createProfile: async (profileData) => {
    set({ isSaving: true });
    try {
      const { data, error } = await $fetch({
        url: "/api/finance/merchant/profile",
        method: "POST",
        body: profileData,
      });
      if (!error && data) {
        set({ profile: data });
        return { success: true };
      }
      return { success: false, error: error || "Failed to create profile" };
    } catch {
      return { success: false, error: "Failed to create profile" };
    } finally {
      set({ isSaving: false });
    }
  },

  updateProfile: async (profileData) => {
    set({ isSaving: true });
    try {
      const { error } = await $fetch({
        url: "/api/finance/merchant/profile",
        method: "PUT",
        body: profileData,
      });
      if (!error) {
        await get().fetchProfile();
        return { success: true };
      }
      return { success: false };
    } catch {
      return { success: false };
    } finally {
      set({ isSaving: false });
    }
  },

  regenerateKeys: async () => {
    try {
      const { data, error } = await $fetch({
        url: "/api/finance/merchant/keys",
        method: "POST",
      });
      if (!error && data) {
        await get().fetchProfile();
        return data;
      }
      return null;
    } catch {
      return null;
    }
  },
}));
