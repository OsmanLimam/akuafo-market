"use client";

import { useMemo, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Inbox, PackagePlus, SlidersHorizontal, Sprout } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { authFetch } from "@/lib/api-client";
import { useAkuafo } from "../store";
import { useAuth } from "../auth-store";
import { AuthGate } from "../auth-gate";
import {
  AnimatedNumber,
  ArrowLink,
  DashboardSkeleton,
  EmptyState,
  ErrorState,
  Eyebrow,
  StatBlock,
  StatusBadge,
  SupplyMeter,
} from "../ui";
import {
  formatCedis,
  formatKg,
  GRADE_LABEL,
  type Order,
  type SupplierProfile,
} from "@/lib/types";
import { greetingPrefix, todayLabel } from "./shared";

const NO_ORDERS: Order[] = [];

async function fetchSupplierOrders(): Promise<Order[]> {
  const res = await authFetch("/api/orders?role=supplier");
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Failed to load orders");
  return data.orders as Order[];
}

async function fetchSupplierProfile(code: string): Promise<SupplierProfile> {
  const res = await fetch(`/api/suppliers/${encodeURIComponent(code)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Failed to load supplier profile");
  return data.supplier as SupplierProfile;
}

async function advanceOrder(id: string): Promise<Order> {
  const res = await authFetch(`/api/orders/${id}/advance`, { method: "POST" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Failed to confirm order");
  return data.order as Order;
}

/* Filled quick action for the supplier dashboard */
function QuickAction({
  icon: Icon,
  onClick,
  children,
}: {
  icon: React.ElementType;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      onClick={onClick}
      className="ax-label h-10 cursor-pointer gap-2 rounded-lg bg-forest px-4 text-[10px] text-cream shadow-none transition-all hover:bg-forest-mid active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-terracotta dark:bg-cream dark:text-ink dark:hover:bg-white dark:focus-visible:ring-gold"
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
      {children}
    </Button>
  );
}

export function SupplierDashboardView() {
  return (
    <AuthGate require="SUPPLIER">
      <SupplierDashboard />
    </AuthGate>
  );
}

function SupplierDashboard() {
  const user = useAuth((s) => s.user)!;
  const openListing = useAkuafo((s) => s.openListing);
  const openSupply = useAkuafo((s) => s.openSupply);
  const openOrder = useAkuafo((s) => s.openOrder);
  const openSupplier = useAkuafo((s) => s.openSupplier);
  const openMarket = useAkuafo((s) => s.openMarket);
  const queryClient = useQueryClient();

  const supplierCode = user.supplierCode ?? null;
  const requestsRef = useRef<HTMLElement | null>(null);
  const supplyRef = useRef<HTMLElement | null>(null);

  const ordersQuery = useQuery({
    queryKey: ["orders", "supplier", user.email],
    queryFn: fetchSupplierOrders,
  });
  const profileQuery = useQuery({
    queryKey: ["supplier", supplierCode],
    queryFn: () => fetchSupplierProfile(supplierCode!),
    enabled: !!supplierCode,
  });

  const supplier = profileQuery.data ?? null;
  const orders = useMemo(
    () => [...(ordersQuery.data ?? NO_ORDERS)].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [ordersQuery.data],
  );
  const supplies = supplier?.supplies ?? [];

  const confirmMutation = useMutation({
    mutationFn: advanceOrder,
    onSuccess: (order) => {
      toast.success("Order confirmed", {
        description: `${order.code} is confirmed and moving to preparation.`,
      });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order"] });
    },
    onError: (err) => {
      toast.error("Couldn't confirm order", { description: err.message });
    },
  });

  const scrollToSection = (ref: React.RefObject<HTMLElement | null>) =>
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  /* ── Metrics ──────────────────────────────────────────────────────────── */
  const metrics = useMemo(() => {
    const active = orders.filter((o) => o.status !== "DELIVERED");
    const cutoff = Date.now() - 30 * 86400000;
    const monthlySales = orders
      .filter((o) => new Date(o.createdAt).getTime() >= cutoff)
      .reduce((s, o) => s + o.productValue, 0);
    return {
      availableSupply: supplies.reduce((s, x) => s + x.quantityKg, 0),
      activeCount: active.length,
      pending: orders.filter((o) => o.status === "REQUESTED").length,
      monthlySales,
    };
  }, [orders, supplies]);

  const isLoading = ordersQuery.isLoading || profileQuery.isLoading;
  const isError = ordersQuery.isError || profileQuery.isError;

  if (isLoading) {
    return (
      <main id="main" className="min-h-[70vh]">
        <div className="mx-auto max-w-[1440px] px-4 pt-28 pb-24 sm:px-6 lg:px-10">
          <DashboardSkeleton />
        </div>
      </main>
    );
  }

  if (isError) {
    return (
      <main id="main" className="min-h-[70vh]">
        <div className="mx-auto max-w-[1440px] px-4 pt-28 pb-24 sm:px-6 lg:px-10">
          <ErrorState
            thing="your dashboard"
            onRetry={() => {
              ordersQuery.refetch();
              profileQuery.refetch();
            }}
          />
        </div>
      </main>
    );
  }

  const firstName = user.name.split(" ")[0];

  return (
    <main id="main" className="min-h-[70vh] bg-background">
      {/* Toasts mount locally (Providers is owned by task 1) */}
      <Toaster
        position="bottom-right"
        offset={88}
        toastOptions={{
          style: { borderRadius: "0.625rem", border: "1px solid var(--border)" },
          classNames: { title: "ax-label", description: "text-xs text-muted-foreground" },
        }}
      />
      <div className="mx-auto max-w-[1440px] px-4 pt-28 pb-24 sm:px-6 lg:px-10">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="pb-10 lg:pb-12">
          <h1 className="font-display text-5xl leading-[1.02] tracking-tight text-ink dark:text-cream sm:text-6xl">
            {greetingPrefix()}, <span className="italic">{firstName}</span>
          </h1>
          <p className="mt-5 text-sm text-muted-foreground">
            {user.businessName || supplier?.name || "Supplier account"}
            {supplier && (
              <>
                {" "}
                · {supplier.town}, {supplier.region}
              </>
            )}{" "}
            · <span className="ax-data">{todayLabel()}</span>
          </p>
        </header>

        {/* ── Quick actions ──────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3" role="group" aria-label="Quick actions">
          <QuickAction icon={PackagePlus} onClick={() => openListing()}>
            List produce
          </QuickAction>
          <QuickAction icon={Inbox} onClick={() => scrollToSection(requestsRef)}>
            View requests
          </QuickAction>
          <QuickAction icon={SlidersHorizontal} onClick={() => scrollToSection(supplyRef)}>
            Update supply
          </QuickAction>
        </div>

        {/* ── Metrics ────────────────────────────────────────────────────── */}
        <section aria-label="Farm metrics" className="mt-10 border-t border-border">
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 py-10 lg:grid-cols-4 lg:py-12">
            <StatBlock
              label="Available supply"
              value={
                <AnimatedNumber value={metrics.availableSupply} format={(n) => formatKg(Math.round(n))} />
              }
              sub="Across listed lots"
            />
            <StatBlock
              label="Active orders"
              value={<AnimatedNumber value={metrics.activeCount} />}
              sub="Not yet delivered"
            />
            <StatBlock
              label="Pending requests"
              value={<AnimatedNumber value={metrics.pending} />}
              sub="Awaiting your confirmation"
            />
            <StatBlock
              label="Monthly sales"
              value={
                <AnimatedNumber
                  value={metrics.monthlySales}
                  format={(n) => formatCedis(Math.round(n), 0)}
                />
              }
              sub="Last 30 days, product value"
            />
          </div>
        </section>

        {/* ── Order requests (actionable first) ─────────────────────────── */}
        <section
          ref={requestsRef}
          aria-labelledby="order-requests-heading"
          className="scroll-mt-28 pb-14 sm:pb-16 lg:pb-20"
        >
          <Eyebrow>Order requests</Eyebrow>
          <h2
            id="order-requests-heading"
            className="mt-4 font-display text-3xl leading-[1.05] tracking-tight text-ink dark:text-cream sm:text-4xl"
          >
            Buyers at your <span className="italic">farm gate.</span>
          </h2>

          <div className="mt-8">
            {orders.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="No requests yet."
                description="Your listings are live. Buyers will find you when they search your commodities."
                actionLabel="View my listings"
                onAction={() => (supplier ? openSupplier(supplier.id) : openMarket())}
              />
            ) : (
              <ul>
                {orders.map((o) => (
                  <li
                    key={o.id}
                    className="flex flex-col gap-4 border-b border-border py-5 first:border-t sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm text-ink dark:text-cream">
                        {o.buyerName}
                        <span className="text-muted-foreground"> · {o.buyerCompany}</span>
                      </p>
                      <p className="ax-data mt-1.5 truncate text-xs text-muted-foreground">
                        {o.supply.name} · {formatKg(o.quantityKg)} · {o.destination}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-5">
                      <StatusBadge status={o.status} />
                      {o.status === "REQUESTED" ? (
                        <Button
                          type="button"
                          onClick={() => confirmMutation.mutate(o.id)}
                          disabled={confirmMutation.isPending && confirmMutation.variables === o.id}
                          className="ax-label h-10 cursor-pointer rounded-lg bg-forest px-5 text-[11px] text-cream shadow-none transition-all hover:bg-forest-mid active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-terracotta dark:bg-cream dark:text-ink dark:hover:bg-white dark:focus-visible:ring-gold"
                        >
                          {confirmMutation.isPending && confirmMutation.variables === o.id
                            ? "Confirming…"
                            : "Confirm"}
                        </Button>
                      ) : (
                        <ArrowLink onClick={() => openOrder(o.id)}>Track</ArrowLink>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* ── Your supply ────────────────────────────────────────────────── */}
        <section
          ref={supplyRef}
          aria-labelledby="your-supply-heading"
          className="scroll-mt-28 border-t border-border py-14 sm:py-16 lg:py-20"
        >
          <Eyebrow>Your supply</Eyebrow>
          <h2
            id="your-supply-heading"
            className="mt-4 font-display text-3xl leading-[1.05] tracking-tight text-ink dark:text-cream sm:text-4xl"
          >
            Lots listed from <span className="italic">{supplier?.town ?? "your farm"}.</span>
          </h2>

          {supplies.length === 0 ? (
            <EmptyState
              icon={Sprout}
              title="Nothing listed yet."
              description="Publish your first lot and it goes live for verified buyers immediately."
              actionLabel="List produce"
              onAction={() => openListing()}
            />
          ) : (
            <ul className="mt-8">
              {supplies.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-col gap-6 border-b border-border py-8 first:border-t lg:flex-row lg:items-center lg:gap-10"
                >
                  <div className="shrink-0 lg:w-60">
                    <h3 className="font-display text-3xl leading-none tracking-tight text-ink dark:text-cream">
                      {s.name}
                    </h3>
                    <p className="ax-data mt-2.5 text-xs text-muted-foreground">
                      {s.code} · {GRADE_LABEL[s.grade]}
                    </p>
                  </div>

                  <div className="max-w-md flex-1">
                    <SupplyMeter
                      total={s.totalQuantityKg}
                      available={s.quantityKg}
                      size="sm"
                    />
                  </div>

                  <div className="flex flex-col items-start gap-2.5 lg:items-end">
                    <span className="ax-data text-sm text-ink dark:text-cream">
                      {formatKg(s.quantityKg)} AVAILABLE
                    </span>
                    <span className="ax-data text-sm text-ink dark:text-cream">
                      {formatCedis(s.pricePerKg)}
                      <span className="text-xs text-muted-foreground"> /KG</span>
                    </span>
                    <ArrowLink onClick={() => openSupply(s.id)}>View</ArrowLink>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
