"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import Cookies from "js-cookie";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  _hydrated: boolean;
  setUser: (user: User) => void;
  setTokens: (access: string, refresh: string) => void;
  logout: () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      _hydrated: false,
      setUser: (user) => set({ user, isAuthenticated: true }),
      setTokens: (access, refresh) => {
        Cookies.set("access_token", access, { expires: 1 });
        Cookies.set("refresh_token", refresh, { expires: 30 });
      },
      logout: () => {
        Cookies.remove("access_token");
        Cookies.remove("refresh_token");
        set({ user: null, isAuthenticated: false });
      },
      setHydrated: () => set({ _hydrated: true }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
