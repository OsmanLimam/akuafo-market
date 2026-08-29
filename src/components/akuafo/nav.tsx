"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  Home,
  LogOut,
  Moon,
  Package,
  Sprout,
  Sun,
  Tractor,
  UserRound,
  LayoutDashboard,
  Bookmark,
} from "lucide-react";
import { useAkuafo } from "./store";
import { useAuth } from "./auth-store";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authFetch } from "@/lib/api-client";
import type { Order } from "@/lib/types";

function ThemeToggle({ light }: { light?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      onClick={() => setTheme(dark ? "light" : "dark")}
      className={cn(
        "h-9 w-9 cursor-pointer rounded-lg",
        light
          ? "text-cream hover:bg-cream/10 hover:text-cream"
          : "text-forest hover:bg-forest/5 dark:text-cream dark:hover:bg-cream/10",
      )}
    >
      <Sun className="hidden h-4 w-4 dark:block" strokeWidth={1.5} aria-hidden />
      <Moon className="block h-4 w-4 dark:hidden" strokeWidth={1.5} aria-hidden />
    </Button>
  );
}

async function fetchMyOrders(role: "BUYER" | "SUPPLIER"): Promise<Order[]> {
  const res = await authFetch(`/api/orders?role=${role === "SUPPLIER" ? "supplier" : "buyer"}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.orders as Order[];
}

/* Notification bell, active orders for the signed-in user */
function NotificationBell({ light }: { light?: boolean }) {
  const { user } = useAuth();
  const openOrder = useAkuafo((s) => s.openOrder);
  const setView = useAkuafo((s) => s.setView);
  const { data, isPending } = useQuery({
    queryKey: ["orders", "notifications", user?.id],
    queryFn: () => fetchMyOrders(user!.role === "SUPPLIER" ? "SUPPLIER" : "BUYER"),
    enabled: !!user,
    staleTime: 30_000,
  });

  /* Active = the order still needs someone's attention. Cancelled orders
     never count, delivered ones are closed. Works for both roles now —
     buyers track their requests, suppliers see lots awaiting action. */
  const active = (data ?? [])
    .filter((o) => o.status !== "DELIVERED" && o.status !== "CANCELLED")
    .slice(0, 4);
  const count = (data ?? []).filter(
    (o) => o.status !== "DELIVERED" && o.status !== "CANCELLED",
  ).length;

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Notifications: ${count} active ${count === 1 ? "order" : "orders"}`}
          className={cn(
            "relative h-9 w-9 cursor-pointer rounded-lg",
            light
              ? "text-cream hover:bg-cream/10 hover:text-cream"
              : "text-forest hover:bg-forest/5 dark:text-cream dark:hover:bg-cream/10",
          )}
        >
          <Bell className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          {count > 0 && (
            <span
              className="absolute right-1.5 top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-terracotta px-0.5 text-[8px] font-semibold text-cream"
              aria-hidden
            >
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 rounded-lg p-0">
        <div className="border-b border-border px-4 py-3">
          <p className="ax-label text-muted-foreground">Active orders</p>
        </div>
        {isPending ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">Loading orders…</div>
        ) : active.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            No orders in progress.
          </div>
        ) : (
          active.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => openOrder(o.id)}
              className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-forest/5 dark:hover:bg-cream/5"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-ink dark:text-cream">
                  {o.supply.name}
                </span>
                <span className="ax-data block text-[11px] text-muted-foreground">
                  {o.code} · {o.quantityKg.toLocaleString()} KG
                </span>
              </span>
              <span className="ax-label shrink-0 text-[9px] text-terracotta-deep dark:text-terracotta">
                {o.status.replace(/_/g, " ")}
              </span>
            </button>
          ))
        )}
        <div className="border-t border-border">
          <button
            type="button"
            onClick={() => setView("buyer")}
            className="ax-label w-full cursor-pointer px-4 py-2.5 text-left text-[10px] text-forest transition-colors hover:bg-forest/5 dark:text-cream dark:hover:bg-cream/5"
          >
            View all orders
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* Account avatar menu */
function AccountMenu({ light }: { light?: boolean }) {
  const { user, signOut } = useAuth();
  const setView = useAkuafo((s) => s.setView);
  const [open, setOpen] = useState(false);
  if (!user) return null;

  const initials = user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");

  const items = [
    { label: "Dashboard", icon: LayoutDashboard, view: user.role === "BUYER" ? "buyer" : "supplier" },
    { label: "Orders", icon: Package, view: "buyer" },
    { label: "Saved items", icon: Bookmark, view: "account" },
    { label: "My account", icon: UserRound, view: "account" },
  ] as const;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          aria-expanded={open}
          className={cn(
            "flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border text-[11px] font-semibold transition-colors",
            light
              ? "border-cream/40 text-cream hover:bg-cream/10"
              : "border-forest/40 text-forest hover:bg-forest/5 dark:border-cream/40 dark:text-cream dark:hover:bg-cream/10",
          )}
        >
          {initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 rounded-lg p-0">
        <DropdownMenuLabel className="border-b border-border px-4 py-3">
          <span className="block truncate text-sm font-semibold text-ink dark:text-cream">{user.name}</span>
          <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
          <span className="ax-label mt-1.5 inline-block text-[9px] text-terracotta-deep dark:text-terracotta">
            {user.role === "BUYER" ? "Buyer account" : "Supplier account"}
          </span>
        </DropdownMenuLabel>
        <div className="py-1">
          {items.map((item) => (
            <DropdownMenuItem
              key={item.label}
              onClick={() => setView(item.view)}
              className="cursor-pointer gap-2.5 px-4 py-2.5 text-sm"
            >
              <item.icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} aria-hidden />
              {item.label}
            </DropdownMenuItem>
          ))}
        </div>
        <DropdownMenuSeparator className="m-0" />
        <DropdownMenuItem
          onClick={() => {
            authFetch("/api/auth/signout", { method: "POST" }).catch(() => undefined);
            signOut();
            setView("landing");
          }}
          className="cursor-pointer gap-2.5 px-4 py-2.5 text-sm text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const NAV_LINKS: { label: string; view: "market" | "buyer" | "supplier"; map?: boolean }[] = [
  { label: "Marketplace", view: "market" },
  { label: "Supply Map", view: "market", map: true },
  { label: "For Buyers", view: "buyer" },
  { label: "For Suppliers", view: "supplier" },
];

export function Nav() {
  const { view, openMarket, setView } = useAkuafo();
  const { user, hydrated } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const overHero = view === "landing" && !scrolled;

  const goHowItWorks = () => {
    setView("landing");
    setTimeout(() => {
      document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 180);
  };

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        overHero
          ? "bg-transparent text-cream"
          : "border-b border-border bg-background/92 text-foreground backdrop-blur-md",
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-6 px-4 sm:px-6 lg:px-10">
        <button
          type="button"
          onClick={() => setView("landing")}
          className="cursor-pointer"
          aria-label="Akuafo Market home"
        >
          <Logo light={overHero} />
        </button>

        <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
          {(hydrated && user
            ? [
                { label: "Marketplace", view: "market" as const },
                { label: "Orders", view: "buyer" as const },
                { label: "How It Works", view: "how" as const },
              ]
            : [...NAV_LINKS, { label: "How It Works", view: "how" as const }]
          ).map((l) => (
            <button
              key={l.label}
              type="button"
              onClick={() => {
                if (l.view === "how") {
                  goHowItWorks();
                } else if (l.view === "market") {
                  openMarket(undefined, "list");
                } else {
                  setView(l.view);
                }
              }}
              className={cn(
                "ax-label cursor-pointer py-1 transition-colors",
                overHero ? "text-cream/80 hover:text-cream" : "text-muted-foreground hover:text-foreground",
                view === l.view && !overHero && "text-foreground",
              )}
            >
              {l.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle light={overHero} />
          {hydrated && user ? (
            <>
              <NotificationBell light={overHero} />
              <AccountMenu light={overHero} />
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => setView("signin")}
                className={cn(
                  "ax-label hidden h-9 cursor-pointer rounded-lg px-4 text-[11px] sm:inline-flex",
                  overHero
                    ? "text-cream hover:bg-cream/10 hover:text-cream"
                    : "text-forest hover:bg-forest/5 dark:text-cream dark:hover:bg-cream/10",
                )}
              >
                Sign in
              </Button>
              <Button
                onClick={() => setView("signup")}
                className={cn(
                  "ax-label h-9 cursor-pointer rounded-lg px-4 text-[11px] shadow-none transition-all active:scale-[0.98]",
                  overHero
                    ? "bg-cream text-ink hover:bg-gold"
                    : "bg-forest text-cream hover:bg-forest-mid dark:bg-cream dark:text-ink dark:hover:bg-white",
                )}
              >
                <span className="hidden sm:inline">Create account</span>
                <span className="sm:hidden">Join</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function MobileTabBar() {
  const { view, setView, openMarket } = useAkuafo();
  const { user, hydrated, signOut } = useAuth();

  const tabs = [
    { label: "Home", icon: Home, active: view === "landing", onClick: () => setView("landing") },
    {
      label: "Market",
      icon: Sprout,
      active: view === "market" || view === "supply" || view === "supplier-profile",
      onClick: () => openMarket(),
    },
    {
      label: user?.role === "SUPPLIER" ? "Sell" : "Orders",
      icon: user?.role === "SUPPLIER" ? Tractor : Package,
      active: view === "buyer" || view === "supplier" || view === "track" || view === "listing",
      onClick: () => setView(user?.role === "SUPPLIER" ? "supplier" : "buyer"),
    },
    {
      label: !hydrated || !user ? "Sign in" : "Account",
      icon: UserRound,
      active: view === "signin" || view === "signup" || view === "account" || view === "forgot" || view === "reset",
      onClick: () => {
        if (!hydrated) return;
        if (user) {
          setView("account");
        } else {
          setView("signin");
        }
      },
    },
  ];

  return (
    <nav
      aria-label="Primary mobile"
      className="fixed inset-x-0 bottom-0 z-50 lg:hidden"
      style={{
        paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)",
        pointerEvents: "none",
      }}
    >
      {/* Liquid glass: floating pill, heavy blur, hairline border */}
      <div
        className="pointer-events-auto mx-3 overflow-hidden rounded-2xl border border-ink/10 bg-background/75 shadow-[0_16px_44px_-16px_rgba(19,28,22,0.4)] backdrop-blur-2xl dark:border-cream/10 dark:bg-[#1c2721]/80"
      >
        <div className="grid h-16 grid-cols-4">
          {tabs.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={t.onClick}
              aria-current={t.active ? "page" : undefined}
              className={cn(
                "relative flex cursor-pointer flex-col items-center justify-center gap-1 transition-colors",
                t.active ? "text-forest dark:text-terracotta" : "text-muted-foreground",
              )}
            >
              {t.active && (
                <motion.span
                  layoutId="tabbar-pill"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  className="absolute inset-x-3 inset-y-2.5 rounded-xl bg-forest/[0.08] dark:bg-cream/[0.09]"
                  aria-hidden
                />
              )}
              <t.icon className="relative h-5 w-5" strokeWidth={1.5} aria-hidden />
              <span className="ax-label relative text-[9px]">{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
