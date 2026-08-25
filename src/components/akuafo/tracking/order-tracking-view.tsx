"use client";

import { Fragment, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Building2,
  CheckCircle2,
  Package,
  PackageX,
  Sprout,
  Truck,
  Wheat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { authFetch } from "@/lib/api-client";
import { useAkuafo } from "../store";
import { useAuth } from "../auth-store";
import {
  ArrowLink,
  DashboardSkeleton,
  DataKey,
  EmptyState,
  ErrorState,
  Eyebrow,
  StatusBadge,
} from "../ui";
import { GhanaMap, type MapRoute } from "../map/ghana-map";
import {
  formatCedis,
  formatKg,
  GRADE_LABEL,
  ORDER_JOURNEY,
  STATUS_LABEL,
  type Order,
  type OrderEvent,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type OrderDetail = Order & { events: OrderEvent[] };

/* ── Data ────────────────────────────────────────────────────────────────── */

async function fetchOrder(id: string): Promise<OrderDetail> {
  const res = await fetch(`/api/orders/${encodeURIComponent(id)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error ?? "Failed to load order") as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return data.order as OrderDetail;
}

/* Local destination coordinate lookup for the route map */
const ACCRA_COORDS = { lat: 5.57, lon: -0.21 };
const DESTINATION_COORDS: { match: RegExp; coords: { lat: number; lon: number } }[] = [
  { match: /accra|odorna/i, coords: ACCRA_COORDS },
  { match: /kasoa/i, coords: { lat: 5.53, lon: -0.42 } },
  { match: /tema/i, coords: { lat: 5.67, lon: 0.02 } },
  { match: /kumasi|adum/i, coords: { lat: 6.69, lon: -1.62 } },
  { match: /\bho\b/i, coords: { lat: 6.6, lon: 0.47 } },
];

function destinationCoords(
  dest: string,
  supplier: { lat: number; lon: number; town: string },
): { lat: number; lon: number } {
  if (/pickup/i.test(dest) || dest.toLowerCase().includes(supplier.town.toLowerCase())) {
    return { lat: supplier.lat, lon: supplier.lon };
  }
  for (const d of DESTINATION_COORDS) {
    if (d.match.test(dest)) return d.coords;
  }
  return ACCRA_COORDS;
}

/* Vehicle position along the route, by order status */
function routeProgress(status: string): number {
  if (status === "DELIVERED") return 1;
  if (status === "IN_TRANSIT") return 0.55;
  return 0;
}

/* Farm-to-buyer stages: reached once the order passes a journey milestone */
const STAGES = [
  { icon: Sprout, label: "Farm", minIdx: 1 },
  { icon: Wheat, label: "Harvested", minIdx: 2 },
  { icon: Package, label: "Packed", minIdx: 3 },
  { icon: Truck, label: "In transit", minIdx: 4 },
  { icon: Building2, label: "Buyer", minIdx: 5 },
] as const;

/* ── Summary row chrome ──────────────────────────────────────────────────── */

function SummaryRow({
  label,
  children,
  last = false,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-6 py-3",
        !last && "border-b border-border",
      )}
    >
      <dt>
        <DataKey>{label}</DataKey>
      </dt>
      <dd className="min-w-0 text-right">{children}</dd>
    </div>
  );
}

/* ── View ────────────────────────────────────────────────────────────────── */

export function OrderTrackingView() {
  const orderId = useAkuafo((s) => s.orderId);
  const setView = useAkuafo((s) => s.setView);
  const user = useAuth((s) => s.user);
  const queryClient = useQueryClient();

  const backView = user?.role === "SUPPLIER" ? "supplier" : "buyer";

  const { data: order, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => fetchOrder(orderId!),
    enabled: !!orderId,
  });

  const advance = useMutation({
    mutationFn: async () => {
      const res = await authFetch(`/api/orders/${orderId}/advance`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to advance order");
      return data.order as OrderDetail;
    },
    onSuccess: (updated) => {
      toast.success("Order updated", {
        description: `${updated.code} is now ${STATUS_LABEL[updated.status] ?? updated.status}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["supplier"] });
    },
    onError: (err) => {
      toast.error("Couldn't advance order", { description: err.message });
    },
  });

  const eventsByStatus = useMemo(() => {
    const m = new Map<string, OrderEvent>();
    order?.events?.forEach((e) => {
      if (!m.has(e.status)) m.set(e.status, e);
    });
    return m;
  }, [order]);

  const journeyIdx = order
    ? Math.max(0, ORDER_JOURNEY.indexOf(order.status as (typeof ORDER_JOURNEY)[number]))
    : 0;
  const nextStatus = ORDER_JOURNEY[journeyIdx + 1];

  const routes: MapRoute[] = useMemo(() => {
    if (!order) return [];
    if (order.deliveryMethod === "PICKUP") return [];
    const to = destinationCoords(order.destination, order.supply.supplier);
    return [
      {
        from: {
          lat: order.supply.supplier.lat,
          lon: order.supply.supplier.lon,
          label: order.supply.supplier.town,
        },
        to: { lat: to.lat, lon: to.lon, label: order.destination },
        label: `${order.supply.supplier.town} → ${order.destination}`,
        progress: routeProgress(order.status),
      },
    ];
  }, [order]);

  const routeLabel = routes[0]?.label ?? null;

  const shell = (children: React.ReactNode) => (
    <main id="main" className="min-h-[70vh] bg-background">
      <Toaster
        position="bottom-right"
        offset={88}
        toastOptions={{
          style: { borderRadius: "0.625rem", border: "1px solid var(--border)" },
          classNames: { title: "ax-label", description: "text-xs text-muted-foreground" },
        }}
      />
      <div className="mx-auto max-w-[1440px] px-4 pt-28 pb-24 sm:px-6 lg:px-10">{children}</div>
    </main>
  );

  if (!orderId) {
    return shell(
      <EmptyState
        icon={PackageX}
        title="We couldn't find this order."
        description="Open an order from your dashboard to follow its journey from farm to buyer."
        actionLabel="Back to orders"
        onAction={() => setView(backView)}
      />,
    );
  }

  if (isLoading) {
    return shell(<DashboardSkeleton />);
  }

  if (isError || !order) {
    const status = (error as (Error & { status?: number }) | null)?.status;
    if (status === 404) {
      return shell(
        <EmptyState
          icon={PackageX}
          title="We couldn't find this order."
          description="This order may have been removed, or the reference is out of date."
          actionLabel="Back to orders"
          onAction={() => setView(backView)}
        />,
      );
    }
    return shell(<ErrorState thing="this order" onRetry={() => refetch()} />);
  }

  return shell(
    <>
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header>
        <ArrowLink onClick={() => setView(backView)}>Back to orders</ArrowLink>
        <div className="mt-8">
          <Eyebrow>Order tracking</Eyebrow>
          <h1 className="mt-4 font-display text-4xl leading-[1.03] tracking-tight text-ink dark:text-cream sm:text-5xl lg:text-6xl">
            {order.supply.name}{" "}
            <span className="ax-data text-[0.55em] font-medium tracking-tight">
              · {formatKg(order.quantityKg)}
            </span>
          </h1>
          <p className="ax-data mt-4 text-sm text-muted-foreground">
            {order.code} · {order.supply.code} · requested{" "}
            {format(new Date(order.createdAt), "d MMM yyyy")}
          </p>
        </div>
      </header>

      <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-10">
        {/* ── Left: journey ──────────────────────────────────────────────── */}
        <div className="flex flex-col gap-12 lg:col-span-7">
          <section aria-label="Order journey timeline">
            <p className="ax-label text-muted-foreground">Order journey</p>

            {/* Timeline: horizontal rail on desktop, vertical on mobile */}
            <ol className="relative mt-6 grid grid-cols-1 md:grid-cols-6">
              {/* Desktop connecting rail, track + filled progress */}
              <span
                aria-hidden
                className="absolute left-[7px] right-[calc(16.667%_-_7px)] top-[6px] hidden h-0.5 overflow-hidden rounded-full bg-border md:block"
              >
                <span
                  className="block h-full rounded-full bg-terracotta transition-[width] duration-500"
                  style={{ width: `${(journeyIdx / (ORDER_JOURNEY.length - 1)) * 100}%` }}
                />
              </span>
              {ORDER_JOURNEY.map((status, i) => {
                const ev = eventsByStatus.get(status);
                const isCurrent = i === journeyIdx;
                const isDone = i < journeyIdx;
                return (
                  <li
                    key={status}
                    className={cn(
                      "relative border-l pl-6 pt-1 md:border-l-0 md:pl-3 md:pt-9",
                      i === 0 && "md:pl-0",
                      i === ORDER_JOURNEY.length - 1 ? "pb-0 md:pb-0" : "pb-8 md:pb-0",
                      /* mobile vertical rail carries the progress colour */
                      i <= journeyIdx && i !== ORDER_JOURNEY.length - 1
                        ? "border-terracotta/60"
                        : "border-border",
                    )}
                  >
                    <span className="absolute left-[-7px] top-[4px] md:left-0 md:top-[-1px]">
                      {isCurrent && (
                        <span
                          aria-hidden
                          className="ax-pulse absolute inset-0 rounded-full bg-terracotta/30"
                        />
                      )}
                      <span
                        aria-hidden
                        className={cn(
                          "relative block h-3.5 w-3.5 rotate-45 border-2",
                          isDone && "border-forest bg-forest dark:border-olive-light dark:bg-olive-light",
                          isCurrent && "border-terracotta bg-terracotta",
                          !isCurrent && !isDone && "border-muted-foreground/40 bg-transparent",
                        )}
                      />
                    </span>
                    <p
                      className={cn(
                        "ax-label",
                        isCurrent
                          ? "font-semibold text-terracotta-deep dark:text-terracotta"
                          : isDone
                            ? "text-foreground"
                            : "text-muted-foreground",
                      )}
                    >
                      {STATUS_LABEL[status]}
                    </p>
                    {ev && (
                      <p className="ax-data mt-1.5 text-[10px] text-muted-foreground">
                        {format(new Date(ev.timestamp), "d MMM · HH:mm")}
                      </p>
                    )}
                    {ev && (
                      <p className="mt-1 truncate text-[10px] text-muted-foreground" title={ev.note}>
                        {ev.note}
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>

            {/* Farm-to-buyer progress */}
            <div className="mt-12 border-t border-border pt-8">
              <p className="ax-label text-muted-foreground">From farm to buyer</p>
              <ol className="mt-6 flex items-start justify-between gap-2">
                {STAGES.map((s, i) => {
                  const reached = journeyIdx >= s.minIdx;
                  return (
                    <Fragment key={s.label}>
                      {i > 0 && (
                        <span
                          aria-hidden
                          className={cn(
                            "mt-[9px] h-px flex-1 border-t",
                            reached ? "border-terracotta/50 dark:border-gold/50" : "border-border",
                          )}
                        />
                      )}
                      <li
                        className={cn(
                          "flex flex-col items-center gap-2",
                          reached ? "opacity-100" : "opacity-40",
                        )}
                      >
                        <s.icon
                          className={cn(
                            "h-5 w-5",
                            reached ? "text-terracotta dark:text-gold" : "text-foreground dark:text-cream",
                          )}
                          strokeWidth={1.5}
                          aria-hidden
                        />
                        <span
                          className={cn(
                            "ax-label text-[9px]",
                            reached ? "text-foreground dark:text-cream" : "text-muted-foreground",
                          )}
                        >
                          {s.label}
                        </span>
                      </li>
                    </Fragment>
                  );
                })}
              </ol>
            </div>
          </section>

          {/* ── Supplier action ──────────────────────────────────────────── */}
          <section
            aria-label="Supplier action"
            className="rounded-xl border border-dashed border-terracotta/50 p-5 dark:border-terracotta/50"
          >
            <p className="ax-label text-terracotta-deep dark:text-terracotta">Supplier action</p>
            {nextStatus ? (
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <Button
                  type="button"
                  onClick={() => advance.mutate()}
                  disabled={advance.isPending}
                  className="ax-label h-11 cursor-pointer rounded-lg bg-forest px-5 text-[11px] text-cream shadow-none transition-all hover:bg-forest-mid active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-terracotta dark:bg-cream dark:text-ink dark:hover:bg-white dark:focus-visible:ring-gold"
                >
                  {advance.isPending ? "Advancing…" : `Advance to ${STATUS_LABEL[nextStatus]}`}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Move {order.code} one step along its journey.
                </p>
              </div>
            ) : (
              <p className="mt-3 flex items-center gap-2 text-sm text-forest dark:text-olive-light">
                <CheckCircle2 className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                Order completed.
              </p>
            )}
          </section>
        </div>

        {/* ── Right: summary ────────────────────────────────────────────── */}
        <aside className="lg:col-span-5" aria-label="Request summary">
          <div className="rounded-xl border border-border bg-card p-6 lg:sticky lg:top-24">
            <p className="ax-label text-muted-foreground">Request summary</p>
            <dl className="mt-3">
              <SummaryRow label="Buyer">
                <span className="flex flex-col">
                  <span className="text-sm text-ink dark:text-cream">{order.buyerName}</span>
                  <span className="text-xs text-muted-foreground">{order.buyerCompany}</span>
                </span>
              </SummaryRow>
              <SummaryRow label="Supplier">
                <span className="flex flex-col">
                  <span className="text-sm text-ink dark:text-cream">
                    {order.supply.supplier.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {order.supply.supplier.town}, {order.supply.supplier.region}
                  </span>
                </span>
              </SummaryRow>
              <SummaryRow label="Commodity">
                <span className="flex flex-col">
                  <span className="text-sm text-ink dark:text-cream">{order.supply.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {GRADE_LABEL[order.supply.grade]}
                  </span>
                </span>
              </SummaryRow>
              <SummaryRow label="Quantity">
                <span className="ax-data text-sm text-ink dark:text-cream">
                  {formatKg(order.quantityKg)}
                </span>
              </SummaryRow>
              <SummaryRow label="Unit price">
                <span className="ax-data text-sm text-ink dark:text-cream">
                  {formatCedis(order.unitPrice)}
                </span>
              </SummaryRow>
              <SummaryRow label="Product value">
                <span className="ax-data text-sm text-ink dark:text-cream">
                  {formatCedis(order.productValue)}
                </span>
              </SummaryRow>
              <SummaryRow label="Delivery">
                <span className="ax-data text-sm text-ink dark:text-cream">
                  {order.deliveryMethod === "PICKUP" ? "Pickup" : "Delivery"} ·{" "}
                  {formatCedis(order.deliveryFee)}
                </span>
              </SummaryRow>
              <SummaryRow label="Total" last>
                <span className="ax-data text-2xl text-ink dark:text-cream">
                  {formatCedis(order.productValue + order.deliveryFee)}
                </span>
              </SummaryRow>
            </dl>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <StatusBadge status={order.status} />
              <span className="ax-data text-xs text-muted-foreground">{order.destination}</span>
            </div>
          </div>
        </aside>
      </div>

      {/* ── Route map ────────────────────────────────────────────────────── */}
      <section aria-label="Route map" className="mt-12 rounded-xl border border-border bg-card p-4 lg:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-3">
          <p className="ax-label text-muted-foreground">Route</p>
          {routeLabel ? (
            <p className="ax-data text-xs text-terracotta-deep dark:text-terracotta">{routeLabel}</p>
          ) : (
            <p className="ax-data text-xs text-terracotta-deep dark:text-terracotta">
              {order.supply.supplier.town} · farm gate
            </p>
          )}
        </div>
        {routes.length > 0 ? (
          <>
            <div className="mx-auto max-w-md pt-4">
              <GhanaMap supplies={[]} routes={routes} />
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {order.supply.supplier.town}, {order.supply.supplier.region} → {order.destination}
            </p>
          </>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Farm-gate pickup: the buyer collects this lot at {order.supply.supplier.town}. No
            transit route to follow.
          </p>
        )}
      </section>
    </>
  );
}
