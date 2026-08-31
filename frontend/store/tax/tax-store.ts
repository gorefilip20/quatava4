import { create } from "zustand";
import { $fetch } from "@/lib/api";

export interface TaxReport {
  id: string;
  userId: string;
  year: number;
  country: string;
  totalTransactions: number;
  totalGains: number;
  totalLosses: number;
  netGain: number;
  taxableAmount: number;
  estimatedTax: number;
  status: "GENERATING" | "READY" | "FAILED";
  downloadUrl?: string;
  createdAt: string;
}

export interface TaxSummary {
  totalRealizedGains: number;
  totalRealizedLosses: number;
  netGain: number;
  transactionCount: number;
  topGains: { asset: string; gain: number }[];
  topLosses: { asset: string; loss: number }[];
}

interface TaxState {
  reports: TaxReport[];
  summary: TaxSummary | null;
  isLoading: boolean;
  isGenerating: boolean;

  fetchReports: () => Promise<void>;
  fetchSummary: (year: number) => Promise<void>;
  generateReport: (data: {
    year: number;
    country: string;
    format: "PDF" | "CSV";
  }) => Promise<{ success: boolean; error?: string }>;
}

export const useTaxStore = create<TaxState>((set, get) => ({
  reports: [],
  summary: null,
  isLoading: false,
  isGenerating: false,

  fetchReports: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await $fetch({
        url: "/api/finance/tax/report",
        silent: true,
      });
      if (!error && data) {
        set({ reports: Array.isArray(data) ? data : [] });
      }
    } catch (err) {
      console.error("Error fetching tax reports:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSummary: async (year) => {
    try {
      const { data, error } = await $fetch({
        url: "/api/finance/tax/summary",
        params: { year },
        silent: true,
      });
      if (!error && data) {
        set({ summary: data });
      }
    } catch (err) {
      console.error("Error fetching tax summary:", err);
    }
  },

  generateReport: async (reportData) => {
    set({ isGenerating: true });
    try {
      const { data, error } = await $fetch({
        url: "/api/finance/tax/report",
        method: "POST",
        body: reportData,
      });
      if (!error && data) {
        set({ reports: [data, ...get().reports] });
        return { success: true };
      }
      return { success: false, error: error || "Failed to generate report" };
    } catch {
      return { success: false, error: "Failed to generate report" };
    } finally {
      set({ isGenerating: false });
    }
  },
}));
