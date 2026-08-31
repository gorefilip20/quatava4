import { create } from "zustand";
import { $fetch } from "@/lib/api";

export interface SavingsVault {
  id: string;
  name: string;
  description: string;
  currency: string;
  apy: number;
  minDeposit: number;
  maxDeposit: number;
  lockPeriodDays: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  totalDeposited: number;
  status: "ACTIVE" | "CLOSED";
}

export interface SavingsDeposit {
  id: string;
  userId: string;
  vaultId: string;
  vaultName: string;
  amount: number;
  currency: string;
  apy: number;
  earned: number;
  dailyEarnings: number;
  startDate: string;
  maturityDate: string;
  status: "ACTIVE" | "MATURED" | "WITHDRAWN";
}

interface SavingsState {
  vaults: SavingsVault[];
  deposits: SavingsDeposit[];
  isLoading: boolean;
  isDepositing: boolean;
  totalEarned: number;
  totalDeposited: number;

  fetchVaults: () => Promise<void>;
  fetchDeposits: () => Promise<void>;
  deposit: (data: {
    vaultId: string;
    amount: number;
    currency: string;
  }) => Promise<{ success: boolean; error?: string }>;
  withdraw: (depositId: string) => Promise<{ success: boolean; error?: string }>;
}

export const useSavingsStore = create<SavingsState>((set, get) => ({
  vaults: [],
  deposits: [],
  isLoading: false,
  isDepositing: false,
  totalEarned: 0,
  totalDeposited: 0,

  fetchVaults: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await $fetch({
        url: "/api/finance/savings/vault",
        silent: true,
      });
      if (!error && data) {
        set({ vaults: Array.isArray(data) ? data : [] });
      }
    } catch (err) {
      console.error("Error fetching savings vaults:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchDeposits: async () => {
    try {
      const { data, error } = await $fetch({
        url: "/api/finance/savings/deposit",
        silent: true,
      });
      if (!error && data) {
        const deposits = Array.isArray(data) ? data : [];
        const totalEarned = deposits.reduce((s, d) => s + (d.earned || 0), 0);
        const totalDeposited = deposits
          .filter((d) => d.status === "ACTIVE")
          .reduce((s, d) => s + d.amount, 0);
        set({ deposits, totalEarned, totalDeposited });
      }
    } catch (err) {
      console.error("Error fetching deposits:", err);
    }
  },

  deposit: async (depositData) => {
    set({ isDepositing: true });
    try {
      const { data, error } = await $fetch({
        url: "/api/finance/savings/deposit",
        method: "POST",
        body: depositData,
      });
      if (!error && data) {
        set({ deposits: [data, ...get().deposits] });
        return { success: true };
      }
      return { success: false, error: error || "Failed to deposit" };
    } catch {
      return { success: false, error: "Failed to deposit" };
    } finally {
      set({ isDepositing: false });
    }
  },

  withdraw: async (depositId) => {
    try {
      const { error } = await $fetch({
        url: `/api/finance/savings/deposit/${depositId}/withdraw`,
        method: "POST",
      });
      if (!error) {
        set({
          deposits: get().deposits.map((d) =>
            d.id === depositId ? { ...d, status: "WITHDRAWN" } : d
          ),
        });
        return { success: true };
      }
      return { success: false, error: "Failed to withdraw" };
    } catch {
      return { success: false, error: "Failed to withdraw" };
    }
  },
}));
