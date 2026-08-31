import { create } from "zustand";
import { $fetch } from "@/lib/api";

export interface Loan {
  id: string;
  userId: string;
  collateralCurrency: string;
  collateralAmount: number;
  borrowCurrency: string;
  borrowAmount: number;
  interestRate: number;
  ltv: number;
  liquidationPrice: number;
  status: "ACTIVE" | "REPAID" | "LIQUIDATED" | "PENDING";
  dueDate: string;
  repaidAmount: number;
  createdAt: string;
}

export interface LoanTerms {
  maxLtv: number;
  interestRate: number;
  minCollateral: number;
  maxBorrow: number;
  availableBorrowCurrencies: string[];
  availableCollateralCurrencies: string[];
  durationDays: number[];
}

interface LoanState {
  loans: Loan[];
  terms: LoanTerms | null;
  isLoading: boolean;
  isBorrowing: boolean;

  fetchLoans: () => Promise<void>;
  fetchTerms: () => Promise<void>;
  borrow: (data: {
    collateralCurrency: string;
    collateralAmount: number;
    borrowCurrency: string;
    durationDays: number;
  }) => Promise<{ success: boolean; error?: string }>;
  repay: (loanId: string, amount: number) => Promise<{ success: boolean; error?: string }>;
}

export const useLoanStore = create<LoanState>((set, get) => ({
  loans: [],
  terms: null,
  isLoading: false,
  isBorrowing: false,

  fetchLoans: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await $fetch({
        url: "/api/finance/loan",
        silent: true,
      });
      if (!error && data) {
        set({ loans: Array.isArray(data) ? data : [] });
      }
    } catch (err) {
      console.error("Error fetching loans:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchTerms: async () => {
    try {
      const { data, error } = await $fetch({
        url: "/api/finance/loan/terms",
        silent: true,
      });
      if (!error && data) {
        set({ terms: data });
      }
    } catch (err) {
      console.error("Error fetching loan terms:", err);
    }
  },

  borrow: async (borrowData) => {
    set({ isBorrowing: true });
    try {
      const { data, error } = await $fetch({
        url: "/api/finance/loan",
        method: "POST",
        body: borrowData,
      });
      if (!error && data) {
        set({ loans: [data, ...get().loans] });
        return { success: true };
      }
      return { success: false, error: error || "Failed to create loan" };
    } catch {
      return { success: false, error: "Failed to create loan" };
    } finally {
      set({ isBorrowing: false });
    }
  },

  repay: async (loanId, amount) => {
    try {
      const { error } = await $fetch({
        url: `/api/finance/loan/${loanId}/repay`,
        method: "POST",
        body: { amount },
      });
      if (!error) {
        await get().fetchLoans();
        return { success: true };
      }
      return { success: false, error: "Failed to repay" };
    } catch {
      return { success: false, error: "Failed to repay" };
    }
  },
}));
