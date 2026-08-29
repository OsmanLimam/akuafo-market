"use client";

import { useAkuafo, type InfoPage, type View } from "./store";

/* ── URL ↔ store sync ───────────────────────────────────────────────────────
   The app is a single-page client-state app. This module makes views
   addressable and shareable (B2B users pass lot links around on WhatsApp):

     /                       landing
     /market                 marketplace
     /lot/AKM-20500          lot detail (by lot code or id)
     /supplier/SUP-1042      supplier profile
     /orders/AKM-ORD-12345   order tracking
     /dashboard/buyer        buyer dashboard
     /dashboard/supplier     supplier dashboard
     /sell                   create listing
     /signin /signup /forgot /reset/<token> /account /info/<page>

   next.config.ts rewrites all unmatched paths to /, so a cold load of any
   deep link boots the app and applyPath() restores the view.             */

const PLAIN_PATHS: Partial<Record<View, string>> = {
  landing: "/",
  market: "/market",
  buyer: "/dashboard/buyer",
  supplier: "/dashboard/supplier",
  listing: "/sell",
  signin: "/signin",
  signup: "/signup",
  forgot: "/forgot",
  account: "/account",
};

export type SyncState = {
  view: View;
  supplyId: string | null;
  orderId: string | null;
  supplierId: string | null;
  infoPage: InfoPage;
  resetToken: string | null;
};

export function stateToPath(s: SyncState): string {
  switch (s.view) {
    case "supply":
      return s.supplyId ? `/lot/${s.supplyId}` : "/market";
    case "supplier-profile":
      return s.supplierId ? `/supplier/${s.supplierId}` : "/market";
    case "track":
      return s.orderId ? `/orders/${s.orderId}` : "/dashboard/buyer";
    case "reset":
      return s.resetToken ? `/reset/${s.resetToken}` : "/signin";
    case "info":
      return `/info/${s.infoPage}`;
    default:
      return PLAIN_PATHS[s.view] ?? "/";
  }
}

/** Apply a pathname to the store. Returns false for unknown paths. */
export function applyPath(pathname: string): boolean {
  const seg = pathname.replace(/\/+$/, "").split("/").filter(Boolean);
  const st = useAkuafo.getState();

  if (seg.length === 0) {
    if (st.view !== "landing") st.setView("landing");
    return true;
  }

  const [head, param] = seg;
  switch (head) {
    case "market":
      st.openMarket();
      return true;
    case "lot":
      if (param) {
        st.openSupply(param);
        return true;
      }
      return false;
    case "supplier":
      if (param) {
        st.openSupplier(param);
        return true;
      }
      return false;
    case "orders":
      if (param) {
        st.openOrder(param);
        return true;
      }
      st.setView("buyer");
      return true;
    case "dashboard":
      st.setView(param === "supplier" ? "supplier" : "buyer");
      return true;
    case "sell":
      st.openListing();
      return true;
    case "signin":
      st.setView("signin");
      return true;
    case "signup":
      st.setView("signup");
      return true;
    case "forgot":
      st.setView("forgot");
      return true;
    case "reset":
      if (param) {
        st.openReset(param);
        return true;
      }
      return false;
    case "account":
      st.setView("account");
      return true;
    case "info":
      st.openInfo((param as InfoPage) ?? "about");
      return true;
    default:
      return false;
  }
}
