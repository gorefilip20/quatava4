import { create } from "zustand";
import { $fetch } from "@/lib/api";

export interface PayrollDeposit {
  id: string;
  employerName: string;
  amount: number;
  currency: string;
  convertTo?: string;
  convertPercentage?: number;
  status: "PENDING" | "COMPLETED" | "FAILED";
  createdAt: string;
}

export interface PayrollConfig {
  id: string;
  userId: string;
  employerWallet?: string;
  receiveCurrency: string;
  autoConvert: boolean;
  convertToCurrency: string;
  convertPercentage: number;
  bankAccount?: string;
  bankName?: string;
  withdrawPercentage: number;
  status: "ACTIVE" | "INACTIVE";
}

interface PayrollState {
  deposits: PayrollDeposit[];
  config: PayrollConfig | null;
  isLoading: boolean;
  isSaving: boolean;

  fetchDeposits: () => Promise<void>;
  fetchConfig: () => Promise<void>;
  saveConfig: (data: Partial<PayrollConfig>) => Promise<{ success: boolean; error?: string }>;
  generateDepositAddress: () => Promise<{ address: string } | null>;
}

export const usePayrollStore = create<PayrollState>((set, get) => ({
  deposits: [],
  config: null,
  isLoading: false,
  isSaving: false,

  fetchDeposits: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await $fetch({
        url: "/api/finance/payroll/deposits",
        silent: true,
      });
      if (!error && data) {
        set({ deposits: Array.isArray(data) ? data : [] });
      }
    } catch (err) {
      console.error("Error fetching payroll deposits:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchConfig: async () => {
    try {
      const { data, error } = await $fetch({
        url: "/api/finance/payroll/config",
        silent: true,
      });
      if (!error && data) {
        set({ config: data });
      }
    } catch (err) {
      console.error("Error fetching payroll config:", err);
    }
  },

  saveConfig: async (configData) => {
    set({ isSaving: true });
    try {
      const { data, error } = await $fetch({
        url: "/api/finance/payroll/config",
        method: "POST",
        body: configData,
      });
      if (!error && data) {
        set({ config: data });
        return { success: true };
      }
      return { success: false, error: error || "Failed to save config" };
    } catch {
      return { success: false, error: "Failed to save config" };
    } finally {
      set({ isSaving: false });
    }
  },

  generateDepositAddress: async () => {
    try {
      const { data, error } = await $fetch({
        url: "/api/finance/payroll/deposit-address",
        method: "POST",
      });
      if (!error && data) {
        return data;
      }
      return null;
    } catch {
      return null;
    }
  },
}));
