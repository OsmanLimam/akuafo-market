"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useAkuafo } from "@/components/akuafo/store";
import { Providers } from "@/components/akuafo/providers";
import { Nav, MobileTabBar } from "@/components/akuafo/nav";
import { Footer } from "@/components/akuafo/footer";
import { Landing } from "@/components/akuafo/landing/landing";
import { MarketplaceView } from "@/components/akuafo/market/marketplace-view";
import { SupplierProfileView } from "@/components/akuafo/market/supplier-profile-view";
import { SupplyDetailView } from "@/components/akuafo/detail/supply-detail-view";
import { BuyerDashboardView } from "@/components/akuafo/dashboard/buyer-dashboard-view";
import { SupplierDashboardView } from "@/components/akuafo/dashboard/supplier-dashboard-view";
import { CreateListingView } from "@/components/akuafo/listing/create-listing-view";
import { OrderTrackingView } from "@/components/akuafo/tracking/order-tracking-view";
import { SignInView } from "@/components/akuafo/auth/signin-view";
import { SignUpView } from "@/components/akuafo/auth/signup-view";
import { ForgotPasswordView } from "@/components/akuafo/auth/forgot-view";
import { ResetPasswordView } from "@/components/akuafo/auth/reset-view";
import { AccountView } from "@/components/akuafo/account/account-view";
import { InfoView } from "@/components/akuafo/info/info-view";
import { applyPath, stateToPath } from "@/components/akuafo/url-sync";

function AppBody() {
  const view = useAkuafo((s) => s.view);
  const reduced = useReducedMotion();

  /* Deep links: restore the view from the URL on cold load, mirror every
     view change into the address bar, and honour browser back/forward. */
  useEffect(() => {
    if (!applyPath(window.location.pathname)) {
      history.replaceState(null, "", "/");
    }

    let applying = false;
    const unsubscribe = useAkuafo.subscribe((s) => {
      if (applying) return;
      const path = stateToPath(s);
      if (window.location.pathname !== path) {
        history.pushState({ view: s.view }, "", path);
      }
    });

    const onPop = () => {
      applying = true;
      if (!applyPath(window.location.pathname)) {
        useAkuafo.getState().setView("landing");
        history.replaceState(null, "", "/");
      }
      // The store updates above run synchronously; release after they settle.
      Promise.resolve().then(() => {
        applying = false;
      });
    };
    window.addEventListener("popstate", onPop);

    return () => {
      unsubscribe();
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [view]);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Nav />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={view}
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? undefined : { opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-1 flex-col"
        >
          {view === "landing" && <Landing />}
          {view === "market" && <MarketplaceView />}
          {view === "supply" && <SupplyDetailView />}
          {view === "supplier-profile" && <SupplierProfileView />}
          {view === "buyer" && <BuyerDashboardView />}
          {view === "supplier" && <SupplierDashboardView />}
          {view === "listing" && <CreateListingView />}
          {view === "track" && <OrderTrackingView />}
          {view === "signin" && <SignInView />}
          {view === "signup" && <SignUpView />}
          {view === "forgot" && <ForgotPasswordView />}
          {view === "reset" && <ResetPasswordView />}
          {view === "account" && <AccountView />}
          {view === "info" && <InfoView />}
        </motion.div>
      </AnimatePresence>
      <Footer />
      <MobileTabBar />
      {/* Spacer so the floating glass tab bar never covers content */}
      <div className="h-[76px] lg:hidden" aria-hidden />
    </div>
  );
}

export default function Home() {
  return (
    <Providers>
      <AppBody />
    </Providers>
  );
}
