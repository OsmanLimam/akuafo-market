"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/* Saved produce & suppliers, local bookmarks for the signed-in user. */

export interface SavedSupply {
  id: string;
  code: string;
  name: string;
  imageUrl: string;
  pricePerKg: number;
  quantityKg: number;
  town: string;
  region: string;
  savedAt: number;
}

export interface SavedSupplier {
  id: string;
  code: string;
  name: string;
  town: string;
  region: string;
  verified: boolean;
  savedAt: number;
}

interface SavedState {
  supplies: SavedSupply[];
  suppliers: SavedSupplier[];
  toggleSupply: (item: SavedSupply) => void;
  toggleSupplier: (item: SavedSupplier) => void;
  isSupplySaved: (id: string) => boolean;
  isSupplierSaved: (id: string) => boolean;
}

export const useSaved = create<SavedState>()(
  persist(
    (set, get) => ({
      supplies: [],
      suppliers: [],
      toggleSupply: (item) =>
        set((s) => ({
          supplies: s.supplies.some((x) => x.id === item.id)
            ? s.supplies.filter((x) => x.id !== item.id)
            : [item, ...s.supplies].slice(0, 50),
        })),
      toggleSupplier: (item) =>
        set((s) => ({
          suppliers: s.suppliers.some((x) => x.id === item.id)
            ? s.suppliers.filter((x) => x.id !== item.id)
            : [item, ...s.suppliers].slice(0, 50),
        })),
      isSupplySaved: (id) => get().supplies.some((x) => x.id === id),
      isSupplierSaved: (id) => get().suppliers.some((x) => x.id === id),
    }),
    { name: "akuafo-saved" },
  ),
);
