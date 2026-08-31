import { create } from "zustand";
import { $fetch } from "@/lib/api";

export interface SavingsGroup {
  id: string;
  name: string;
  creatorId: string;
  creatorName: string;
  currency: string;
  contributionAmount: number;
  frequency: "WEEKLY" | "BIWEEKLY" | "MONTHLY";
  memberCount: number;
  maxMembers: number;
  currentRound: number;
  totalRounds: number;
  totalPool: number;
  nextPayoutDate: string;
  nextRecipient?: string;
  status: "FORMING" | "ACTIVE" | "COMPLETED";
  members: GroupMember[];
  createdAt: string;
}

export interface GroupMember {
  id: string;
  userId: string;
  name: string;
  avatar?: string;
  roundNumber: number;
  hasPaid: boolean;
  hasReceived: boolean;
  joinedAt: string;
}

interface SavingsGroupState {
  groups: SavingsGroup[];
  myGroups: SavingsGroup[];
  isLoading: boolean;
  isCreating: boolean;

  fetchGroups: () => Promise<void>;
  fetchMyGroups: () => Promise<void>;
  createGroup: (data: {
    name: string;
    currency: string;
    contributionAmount: number;
    frequency: string;
    maxMembers: number;
  }) => Promise<{ success: boolean; error?: string }>;
  joinGroup: (groupId: string) => Promise<{ success: boolean; error?: string }>;
  contributeToGroup: (groupId: string) => Promise<{ success: boolean; error?: string }>;
  leaveGroup: (groupId: string) => Promise<{ success: boolean }>;
}

export const useSavingsGroupStore = create<SavingsGroupState>((set, get) => ({
  groups: [],
  myGroups: [],
  isLoading: false,
  isCreating: false,

  fetchGroups: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await $fetch({
        url: "/api/finance/savings-group",
        silent: true,
      });
      if (!error && data) {
        set({ groups: Array.isArray(data) ? data : [] });
      }
    } catch (err) {
      console.error("Error fetching savings groups:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMyGroups: async () => {
    try {
      const { data, error } = await $fetch({
        url: "/api/finance/savings-group/my",
        silent: true,
      });
      if (!error && data) {
        set({ myGroups: Array.isArray(data) ? data : [] });
      }
    } catch (err) {
      console.error("Error fetching my savings groups:", err);
    }
  },

  createGroup: async (groupData) => {
    set({ isCreating: true });
    try {
      const { data, error } = await $fetch({
        url: "/api/finance/savings-group",
        method: "POST",
        body: groupData,
      });
      if (!error && data) {
        set({ myGroups: [data, ...get().myGroups] });
        return { success: true };
      }
      return { success: false, error: error || "Failed to create group" };
    } catch {
      return { success: false, error: "Failed to create group" };
    } finally {
      set({ isCreating: false });
    }
  },

  joinGroup: async (groupId) => {
    try {
      const { error } = await $fetch({
        url: `/api/finance/savings-group/${groupId}/join`,
        method: "POST",
      });
      if (!error) {
        await get().fetchGroups();
        await get().fetchMyGroups();
        return { success: true };
      }
      return { success: false, error: "Failed to join group" };
    } catch {
      return { success: false, error: "Failed to join group" };
    }
  },

  contributeToGroup: async (groupId) => {
    try {
      const { error } = await $fetch({
        url: `/api/finance/savings-group/${groupId}/contribute`,
        method: "POST",
      });
      if (!error) {
        await get().fetchMyGroups();
        return { success: true };
      }
      return { success: false, error: "Failed to contribute" };
    } catch {
      return { success: false, error: "Failed to contribute" };
    }
  },

  leaveGroup: async (groupId) => {
    try {
      const { error } = await $fetch({
        url: `/api/finance/savings-group/${groupId}/leave`,
        method: "POST",
      });
      if (!error) {
        set({
          myGroups: get().myGroups.filter((g) => g.id !== groupId),
        });
        return { success: true };
      }
      return { success: false };
    } catch {
      return { success: false };
    }
  },
}));
