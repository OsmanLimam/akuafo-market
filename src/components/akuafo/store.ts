"use client";

import { create } from "zustand";

export type View =
  | "landing"
  | "market"
  | "supply"
  | "buyer"
  | "supplier"
  | "listing"
  | "track"
  | "supplier-profile"
  | "signin"
  | "signup"
  | "forgot"
  | "reset"
  | "account"
  | "info";

export type InfoPage = "about" | "terms" | "privacy";

export interface MarketFilters {
  q: string;
  region: string;
  category: string;
  grade: string;
  minQty: number | null;
  maxPrice: number | null;
  deliveryOnly: boolean;
  verifiedOnly: boolean;
  sort: string;
}

export const EMPTY_FILTERS: MarketFilters = {
  q: "",
  region: "",
  category: "",
  grade: "",
  minQty: null,
  maxPrice: null,
  deliveryOnly: false,
  verifiedOnly: false,
  sort: "relevance",
};

interface AkuafoState {
  view: View;
  prevView: View | null;
  supplyId: string | null;
  orderId: string | null;
  supplierId: string | null;
  filters: MarketFilters;
  marketMode: "list" | "map";
  infoPage: InfoPage;
  resetToken: string | null;
  setView: (v: View) => void;
  openMarket: (patch?: Partial<MarketFilters>, mode?: "list" | "map") => void;
  openSupply: (id: string) => void;
  openOrder: (id: string) => void;
  openSupplier: (id: string) => void;
  openListing: () => void;
  openInfo: (page: InfoPage) => void;
  openReset: (token: string) => void;
  setFilters: (patch: Partial<MarketFilters>) => void;
  resetFilters: () => void;
  setMarketMode: (mode: "list" | "map") => void;
}

export const useAkuafo = create<AkuafoState>((set) => ({
  view: "landing",
  prevView: null,
  supplyId: null,
  orderId: null,
  supplierId: null,
  filters: { ...EMPTY_FILTERS },
  marketMode: "list",
  infoPage: "about",
  resetToken: null,
  setView: (view) => set((s) => ({ view, prevView: s.view })),
  openMarket: (patch, mode) =>
    set((s) => ({
      view: "market",
      prevView: s.view,
      marketMode: mode ?? s.marketMode,
      filters: { ...s.filters, ...patch },
    })),
  openSupply: (supplyId) => set((s) => ({ view: "supply", prevView: s.view, supplyId })),
  openOrder: (orderId) => set((s) => ({ view: "track", prevView: s.view, orderId })),
  openSupplier: (supplierId) => set((s) => ({ view: "supplier-profile", prevView: s.view, supplierId })),
  openListing: () => set((s) => ({ view: "listing", prevView: s.view })),
  openInfo: (infoPage) => set((s) => ({ view: "info", prevView: s.view, infoPage })),
  openReset: (token) => set((s) => ({ view: "reset", prevView: s.view, resetToken: token })),
  setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
  resetFilters: () => set({ filters: { ...EMPTY_FILTERS } }),
  setMarketMode: (mode) => set({ marketMode: mode }),
}));
