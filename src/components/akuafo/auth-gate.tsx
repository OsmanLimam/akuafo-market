"use client";

import { Lock, Sprout, Store } from "lucide-react";
import { useAkuafo } from "./store";
import { useAuth } from "./auth-store";
import { EmptyState } from "./ui";

/**
 * Gates a view behind authentication. Shows a polished signed-out state
 * when the visitor isn't authenticated (or has the wrong account type).
 */
export function AuthGate({
  require = "auth",
  children,
}: {
  require?: "auth" | "BUYER" | "SUPPLIER";
  children: React.ReactNode;
}) {
  const { user, hydrated } = useAuth();
  const setView = useAkuafo((s) => s.setView);
  const setRedirectAfterAuth = useAuth((s) => s.setRedirectAfterAuth);

  if (!hydrated) {
    return (
      <main id="main" className="min-h-[70vh]">
        <div className="mx-auto max-w-[1440px] px-4 pt-28 pb-24 sm:px-6 lg:px-10">
          <div className="flex h-64 items-center justify-center" aria-busy="true">
            <span className="ax-label text-muted-foreground">Loading…</span>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    const isSupplierArea = require === "SUPPLIER";
    return (
      <main id="main" className="min-h-[70vh]">
        <div className="mx-auto max-w-[1440px] px-4 pt-28 pb-24 sm:px-6 lg:px-10">
          <EmptyState
            icon={isSupplierArea ? Store : Sprout}
            title={isSupplierArea ? "Sell your produce on Akuafo Market." : "Sign in to view your dashboard."}
            description={
              isSupplierArea
                ? "Create a supplier account to list your produce, receive requests from buyers, and track your orders."
                : "Sign in or create a free account to request produce, track your orders, and see your sourcing history."
            }
            actionLabel="Create an account"
            onAction={() => {
              setRedirectAfterAuth(null);
              setView(isSupplierArea ? "signup" : "signup");
            }}
            secondaryLabel="Sign in"
            onSecondary={() => setView("signin")}
          />
        </div>
      </main>
    );
  }

  if (require !== "auth" && user.role !== require) {
    const isBuyerOnSupplier = require === "SUPPLIER";
    return (
      <main id="main" className="min-h-[70vh]">
        <div className="mx-auto max-w-[1440px] px-4 pt-28 pb-24 sm:px-6 lg:px-10">
          <EmptyState
            icon={Lock}
            title={isBuyerOnSupplier ? "This area is for supplier accounts." : "This area is for buyer accounts."}
            description={
              isBuyerOnSupplier
                ? `You're signed in as a buyer (${user.email}). Create a supplier account to list produce and receive requests.`
                : `You're signed in as a supplier (${user.email}). Buyer dashboards show sourcing history and analytics.`
            }
            actionLabel="Continue to my dashboard"
            onAction={() => setView(user.role === "BUYER" ? "buyer" : "supplier")}
          />
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
