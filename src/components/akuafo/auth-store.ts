"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: "BUYER" | "SUPPLIER";
  businessName: string;
  location: string;
  phone: string;
  interests: string;
  supplierId: string | null;
  supplierCode?: string | null;
};

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  hydrated: boolean;
  redirectAfterAuth: string | null;
  setHydrated: () => void;
  signIn: (user: AuthUser, token: string) => void;
  signOut: () => void;
  setUser: (user: AuthUser) => void;
  setRedirectAfterAuth: (view: string | null) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      hydrated: false,
      redirectAfterAuth: null,
      setHydrated: () => set({ hydrated: true }),
      signIn: (user, token) => set({ user, token }),
      signOut: () => set({ user: null, token: null, redirectAfterAuth: null }),
      setUser: (user) => set({ user }),
      setRedirectAfterAuth: (view) => set({ redirectAfterAuth: view }),
    }),
    {
      name: "akuafo-auth",
      partialize: (s) => ({ user: s.user, token: s.token }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
