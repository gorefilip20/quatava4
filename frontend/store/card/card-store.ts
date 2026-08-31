import { create } from "zustand";
import { $fetch } from "@/lib/api";

export interface VirtualCard {
  id: string;
  userId: string;
  cardNumber: string;
  lastFour: string;
  expiryMonth: number;
  expiryYear: number;
  type: "VIRTUAL" | "PHYSICAL";
  status: "ACTIVE" | "FROZEN" | "CANCELLED" | "PENDING";
  balance: number;
  currency: string;
  dailyLimit: number;
  monthlyLimit: number;
  dailySpent: number;
  monthlySpent: number;
  createdAt: string;
}

export interface CardTransaction {
  id: string;
  cardId: string;
  merchant: string;
  amount: number;
  currency: string;
  category: string;
  status: "COMPLETED" | "PENDING" | "DECLINED";
  createdAt: string;
}

interface CardState {
  cards: VirtualCard[];
  transactions: CardTransaction[];
  isLoading: boolean;
  isCreating: boolean;

  fetchCards: () => Promise<void>;
  fetchTransactions: (cardId: string) => Promise<void>;
  createCard: (data: {
    currency: string;
    fundingSource: string;
    dailyLimit: number;
  }) => Promise<{ success: boolean; error?: string }>;
  topUp: (cardId: string, amount: number, source: string) => Promise<{ success: boolean }>;
  freezeCard: (cardId: string) => Promise<{ success: boolean }>;
  unfreezeCard: (cardId: string) => Promise<{ success: boolean }>;
  setLimits: (cardId: string, daily: number, monthly: number) => Promise<{ success: boolean }>;
}

export const useCardStore = create<CardState>((set, get) => ({
  cards: [],
  transactions: [],
  isLoading: false,
  isCreating: false,

  fetchCards: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await $fetch({
        url: "/api/finance/card",
        silent: true,
      });
      if (!error && data) {
        set({ cards: Array.isArray(data) ? data : [] });
      }
    } catch (err) {
      console.error("Error fetching cards:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchTransactions: async (cardId) => {
    try {
      const { data, error } = await $fetch({
        url: `/api/finance/card/${cardId}/transactions`,
        silent: true,
      });
      if (!error && data) {
        set({ transactions: Array.isArray(data) ? data : [] });
      }
    } catch (err) {
      console.error("Error fetching card transactions:", err);
    }
  },

  createCard: async (cardData) => {
    set({ isCreating: true });
    try {
      const { data, error } = await $fetch({
        url: "/api/finance/card",
        method: "POST",
        body: cardData,
      });
      if (!error && data) {
        set({ cards: [data, ...get().cards] });
        return { success: true };
      }
      return { success: false, error: error || "Failed to create card" };
    } catch {
      return { success: false, error: "Failed to create card" };
    } finally {
      set({ isCreating: false });
    }
  },

  topUp: async (cardId, amount, source) => {
    try {
      const { error } = await $fetch({
        url: `/api/finance/card/${cardId}/topup`,
        method: "POST",
        body: { amount, source },
      });
      if (!error) {
        await get().fetchCards();
        return { success: true };
      }
      return { success: false };
    } catch {
      return { success: false };
    }
  },

  freezeCard: async (cardId) => {
    try {
      const { error } = await $fetch({
        url: `/api/finance/card/${cardId}/freeze`,
        method: "PUT",
      });
      if (!error) {
        set({
          cards: get().cards.map((c) =>
            c.id === cardId ? { ...c, status: "FROZEN" } : c
          ),
        });
        return { success: true };
      }
      return { success: false };
    } catch {
      return { success: false };
    }
  },

  unfreezeCard: async (cardId) => {
    try {
      const { error } = await $fetch({
        url: `/api/finance/card/${cardId}/unfreeze`,
        method: "PUT",
      });
      if (!error) {
        set({
          cards: get().cards.map((c) =>
            c.id === cardId ? { ...c, status: "ACTIVE" } : c
          ),
        });
        return { success: true };
      }
      return { success: false };
    } catch {
      return { success: false };
    }
  },

  setLimits: async (cardId, daily, monthly) => {
    try {
      const { error } = await $fetch({
        url: `/api/finance/card/${cardId}/limits`,
        method: "PUT",
        body: { dailyLimit: daily, monthlyLimit: monthly },
      });
      if (!error) {
        set({
          cards: get().cards.map((c) =>
            c.id === cardId ? { ...c, dailyLimit: daily, monthlyLimit: monthly } : c
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
