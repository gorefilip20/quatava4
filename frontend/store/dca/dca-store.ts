import { create } from "zustand";
import { $fetch } from "@/lib/api";

export interface DcaPlan {
  id: string;
  userId: string;
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  frequency: "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY";
  nextExecution: string;
  totalInvested: number;
  totalReceived: number;
  averagePrice: number;
  status: "ACTIVE" | "PAUSED" | "CANCELLED";
  executionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DcaExecution {
  id: string;
  planId: string;
  fromAmount: number;
  toAmount: number;
  rate: number;
  status: "COMPLETED" | "FAILED";
  executedAt: string;
}

interface DcaState {
  plans: DcaPlan[];
  executions: DcaExecution[];
  isLoading: boolean;
  isCreating: boolean;

  fetchPlans: () => Promise<void>;
  fetchExecutions: (planId: string) => Promise<void>;
  createPlan: (data: {
    fromCurrency: string;
    toCurrency: string;
    amount: number;
    frequency: string;
  }) => Promise<{ success: boolean; error?: string }>;
  pausePlan: (id: string) => Promise<{ success: boolean }>;
  resumePlan: (id: string) => Promise<{ success: boolean }>;
  cancelPlan: (id: string) => Promise<{ success: boolean }>;
}

export const useDcaStore = create<DcaState>((set, get) => ({
  plans: [],
  executions: [],
  isLoading: false,
  isCreating: false,

  fetchPlans: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await $fetch({
        url: "/api/finance/dca",
        silent: true,
      });
      if (!error && data) {
        set({ plans: Array.isArray(data) ? data : [] });
      }
    } catch (err) {
      console.error("Error fetching DCA plans:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchExecutions: async (planId) => {
    try {
      const { data, error } = await $fetch({
        url: `/api/finance/dca/${planId}/executions`,
        silent: true,
      });
      if (!error && data) {
        set({ executions: Array.isArray(data) ? data : [] });
      }
    } catch (err) {
      console.error("Error fetching DCA executions:", err);
    }
  },

  createPlan: async (planData) => {
    set({ isCreating: true });
    try {
      const { data, error } = await $fetch({
        url: "/api/finance/dca",
        method: "POST",
        body: planData,
      });
      if (!error && data) {
        set({ plans: [data, ...get().plans] });
        return { success: true };
      }
      return { success: false, error: error || "Failed to create plan" };
    } catch (err) {
      return { success: false, error: "Failed to create DCA plan" };
    } finally {
      set({ isCreating: false });
    }
  },

  pausePlan: async (id) => {
    try {
      const { error } = await $fetch({
        url: `/api/finance/dca/${id}/pause`,
        method: "PUT",
      });
      if (!error) {
        set({
          plans: get().plans.map((p) =>
            p.id === id ? { ...p, status: "PAUSED" } : p
          ),
        });
        return { success: true };
      }
      return { success: false };
    } catch {
      return { success: false };
    }
  },

  resumePlan: async (id) => {
    try {
      const { error } = await $fetch({
        url: `/api/finance/dca/${id}/resume`,
        method: "PUT",
      });
      if (!error) {
        set({
          plans: get().plans.map((p) =>
            p.id === id ? { ...p, status: "ACTIVE" } : p
          ),
        });
        return { success: true };
      }
      return { success: false };
    } catch {
      return { success: false };
    }
  },

  cancelPlan: async (id) => {
    try {
      const { error } = await $fetch({
        url: `/api/finance/dca/${id}`,
        method: "DELETE",
      });
      if (!error) {
        set({
          plans: get().plans.map((p) =>
            p.id === id ? { ...p, status: "CANCELLED" } : p
          ),
        });
        return { success: true };
      }
      return { success: false };
    } catch {
      return { success: false };
    }
  },
}));
