import { create } from "zustand";

interface PresenceEntry {
  isOnline: boolean;
  lastSeenAt: string | null;
}

interface PresenceState {
  byUserId: Record<string, PresenceEntry>;
  setPresence: (userId: string, entry: PresenceEntry) => void;
  seedFromMembers: (members: Array<{ userId: string; isOnline?: boolean; lastSeenAt?: string | null }>) => void;
}

export const usePresenceStore = create<PresenceState>((set) => ({
  byUserId: {},
  setPresence: (userId, entry) =>
    set((state) => ({ byUserId: { ...state.byUserId, [userId]: entry } })),
  seedFromMembers: (members) =>
    set((state) => {
      const next = { ...state.byUserId };
      for (const m of members) {
        if (!next[m.userId]) {
          next[m.userId] = { isOnline: !!m.isOnline, lastSeenAt: m.lastSeenAt ?? null };
        }
      }
      return { byUserId: next };
    }),
}));
