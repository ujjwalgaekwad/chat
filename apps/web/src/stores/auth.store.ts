import { create } from "zustand";
import type { UserDTO } from "@chat-platform/shared";

interface AuthState {
  user: UserDTO | null;
  accessToken: string | null;
  isHydrating: boolean;
  setSession: (user: UserDTO, accessToken: string) => void;
  updateUser: (user: Partial<UserDTO>) => void;
  clearSession: () => void;
  setHydrating: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isHydrating: true,
  setSession: (user, accessToken) => set({ user, accessToken, isHydrating: false }),
  updateUser: (partial) => set((state) => ({ user: state.user ? { ...state.user, ...partial } : state.user })),
  clearSession: () => set({ user: null, accessToken: null, isHydrating: false }),
  setHydrating: (value) => set({ isHydrating: value }),
}));
