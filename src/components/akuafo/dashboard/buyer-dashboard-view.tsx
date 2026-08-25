"use client";

import { useMemo } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { format, isSameMonth, subMonths } from "date-fns";
import { Bookmark, Map as MapIcon, Search, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authFetch } from "@/lib/api-client";
import { useAkuafo } from "../store";
import { useAuth } from "../auth-store";
import { AuthGate } from "../auth-gate";
import {
  AnimatedNumber,
  ArrowLink,
  CtaPrimary,
  DashboardSkeleton,
  EmptyState,
  ErrorState,
  Eyebrow,
  StatBlock,
  StatusBadge,
} from "../ui";
import { formatCedis, formatKg, type Order } from "@/lib/types";
import { greetingPrefix, todayLabel } from "./shared";
import { cn } from "@/lib/utils";

const NO_ORDERS: Order[] = [];

async function fetchBuyerOrders(): Promise<Order[]> {
  const res = await authFetch("/api/orders?role=buyer");
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Failed to load orders");
  return data.orders as Order[];
}

function orderTotal(o: Order): number {
  return o.productValue + o.deliveryFee;
}

/* Compact figure for chart labels: 36480 -> "36.5K" */
function compactCedis(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
  return `${Math.round(v)}`;
}

/* Small outline quick action (browse / map / saved) */
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
      variant="outline"
      onClick={onClick}
      className="ax-label h-10 cursor-pointer gap-2 rounded-lg border-forest/30 px-4 text-[10px] text-forest shadow-none transition-all hover:border-forest hover:bg-forest/5 active:scale-[0.98] dark:border-cream/40 dark:text-cream dark:hover:border-cream dark:hover:bg-cream/10"
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
      {children}
    </Button>
  );
}

export function BuyerDashboardView() {
  return (
    <AuthGate require="BUYER">
      <BuyerDashboard />
    </AuthGate>
  );
}

function BuyerDashboard() {
  const user = useAuth((s) => s.user)!;
  const openMarket = useAkuafo((s) => s.openMarket);
  const openOrder = useAkuafo((s) => s.openOrder);
  const setView = useAkuafo((s) => s.setView);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["orders", "buyer", user.email],
    queryFn: fetchBuyerOrders,
  });

  const orders = useMemo(
    () => [...(data ?? NO_ORDERS)].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [data],
  );

  const firstName = user.name.split(" ")[0];

  const goHowItWorks = () => {
    setView("landing");
    window.setTimeout(
      () => {
        const el = document.getElementById("how-it-works");
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        } else {
          // Landing still mounting through the view transition, retry once
          // after it lands so the scroll isn't lost.
          window.setTimeout(
            () => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" }),
            340,
          );
        }
      },
      180,
    );
  };

  /* ── Metrics ──────────────────────────────────────────────────────────── */
  const metrics = useMemo(() => {
    const active = orders.filter((o) => o.status !== "DELIVERED");
    const cutoff = Date.now() - 30 * 86400000;
    const monthlySpend = orders
      .filter((o) => new Date(o.createdAt).getTime() >= cutoff)
      .reduce((s, o) => s + orderTotal(o), 0);
    const suppliers = new Set(active.map((o) => o.supply.supplier.name));
    return {
      active,
      pending: orders.filter((o) => o.status === "REQUESTED").length,
      monthlySpend,
      activeSuppliers: suppliers.size,
    };
  }, [orders]);

  /* ── Analytics: spend by commodity ────────────────────────────────────── */
  const commoditySpend = useMemo(() => {
    const map = new Map<string, number>();
    orders.forEach((o) => map.set(o.supply.name, (map.get(o.supply.name) ?? 0) + orderTotal(o)));
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [orders]);
  const maxCommoditySpend = commoditySpend[0]?.[1] ?? 1;

  /* ── Analytics: monthly spend, last 6 months ──────────────────────────── */
  const monthlySpend = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), 5 - i));
    return months.map((m) => ({
      label: format(m, "MMM").toUpperCase(),
      total: orders
        .filter((o) => isSameMonth(new Date(o.createdAt), m))
        .reduce((s, o) => s + orderTotal(o), 0),
    }));
  }, [orders]);
  const maxMonthlySpend = Math.max(1, ...monthlySpend.map((m) => m.total));

  /* ── Analytics: average purchase price per kg ─────────────────────────── */
  const priceStats = useMemo(() => {
    const map = new Map<string, { qty: number; value: number; last: number; lastAt: number }>();
    orders.forEach((o) => {
      const cur = map.get(o.supply.name) ?? { qty: 0, value: 0, last: o.unitPrice, lastAt: 0 };
      const t = new Date(o.createdAt).getTime();
      cur.qty += o.quantityKg;
      cur.value += o.productValue;
      if (t >= cur.lastAt) {
        cur.lastAt = t;
        cur.last = o.unitPrice;
      }
      map.set(o.supply.name, cur);
    });
    return [...map.entries()].map(([name, s]) => ({
      name,
      avg: s.qty > 0 ? s.value / s.qty : 0,
      last: s.last,
    }));
  }, [orders]);

  /* ── Analytics: supplier performance ──────────────────────────────────── */
  const supplierStats = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    orders.forEach((o) => {
      const cur = map.get(o.supply.supplier.name) ?? { count: 0, total: 0 };
      cur.count += 1;
      cur.total += orderTotal(o);
      map.set(o.supply.supplier.name, cur);
    });
    const rows = [...map.entries()]
      .map(([name, s]) => ({ name, ...s }))
      .sort((a, b) => b.total - a.total);
    const grand = rows.reduce((s, r) => s + r.total, 0) || 1;
    return { rows, grand };
  }, [orders]);

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
          <ErrorState thing="your orders" onRetry={() => refetch()} />
        </div>
      </main>
    );
  }

  return (
    <main id="main" className="min-h-[70vh] bg-background">
      <div className="mx-auto max-w-[1440px] px-4 pt-28 pb-24 sm:px-6 lg:px-10">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="flex flex-col gap-8 pb-10 lg:flex-row lg:items-end lg:justify-between lg:pb-12">
          <div>
            <h1 className="font-display text-5xl leading-[1.02] tracking-tight text-ink dark:text-cream sm:text-6xl">
              {greetingPrefix()}, <span className="italic">{firstName}</span>
            </h1>
            <p className="mt-5 text-sm text-muted-foreground">
              {user.businessName || "Buyer account"} ·{" "}
              <span className="ax-data">{todayLabel()}</span>
            </p>
          </div>
          <CtaPrimary onClick={() => openMarket()} className="shrink-0">
            New request
          </CtaPrimary>
        </header>

        {/* ── Quick actions ──────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3" role="group" aria-label="Quick actions">
          <QuickAction icon={Search} onClick={() => openMarket()}>
            Browse marketplace
          </QuickAction>
          <QuickAction icon={MapIcon} onClick={() => openMarket(undefined, "map")}>
            Supply map
          </QuickAction>
          <QuickAction icon={Bookmark} onClick={() => setView("account")}>
            Saved items
          </QuickAction>
        </div>

        {orders.length === 0 ? (
          /* ── Empty state: brand-new buyer ─────────────────────────────── */
          <section aria-label="Getting started" className="mt-6 border-t border-border">
            <EmptyState
              icon={Sprout}
              title="Your procurement journey starts here."
              description="Browse verified supply across Ghana and place your first request. Compare prices, quantities and harvest windows in one place."
              actionLabel="Explore produce"
              onAction={() => openMarket()}
              secondaryLabel="How it works"
              onSecondary={goHowItWorks}
            />
          </section>
        ) : (
          <>
            {/* ── Metrics ─────────────────────────────────────────────────── */}
            <section aria-label="Account metrics" className="mt-10 border-t border-border">
              <div className="grid grid-cols-2 gap-x-8 gap-y-10 py-10 lg:grid-cols-4 lg:py-12">
                <StatBlock
                  label="Active orders"
                  value={<AnimatedNumber value={metrics.active.length} />}
                  sub="Not yet delivered"
                />
                <StatBlock
                  label="Pending requests"
                  value={<AnimatedNumber value={metrics.pending} />}
                  sub="Awaiting supplier confirmation"
                />
                <StatBlock
                  label="Monthly spend"
                  value={
                    <AnimatedNumber
                      value={metrics.monthlySpend}
                      format={(n) => formatCedis(Math.round(n), 0)}
                    />
                  }
                  sub="Last 30 days, incl. delivery"
                />
                <StatBlock
                  label="Active suppliers"
                  value={<AnimatedNumber value={metrics.activeSuppliers} />}
                  sub="Across open orders"
                />
              </div>
            </section>

            {/* ── Current procurement ────────────────────────────────────── */}
            <section aria-labelledby="current-procurement-heading" className="py-14 sm:py-16 lg:py-20">
              <Eyebrow>Current procurement</Eyebrow>
              <h2
                id="current-procurement-heading"
                className="mt-4 font-display text-3xl leading-[1.05] tracking-tight text-ink dark:text-cream sm:text-4xl"
              >
                In motion, <span className="italic">right now.</span>
              </h2>

              <div className="mt-8">
                {metrics.active.length === 0 ? (
                  <EmptyState
                    icon={Sprout}
                    title="Nothing in motion right now."
                    description="Every order on record is delivered. Place a new request to keep your supply flowing."
                    actionLabel="Explore produce"
                    onAction={() => openMarket()}
                  />
                ) : (
                  <ul>
                    {metrics.active.map((o) => (
                      <li key={o.id} className="border-b border-border first:border-t">
                        <div
                          role="button"
                          tabIndex={0}
                          aria-label={`Track order ${o.code}, ${o.supply.name} from ${o.supply.supplier.name}`}
                          onClick={() => openOrder(o.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              openOrder(o.id);
                            }
                          }}
                          className="group flex cursor-pointer items-center gap-4 px-1 py-5 transition-colors hover:bg-forest/[0.03] dark:hover:bg-cream/[0.04] sm:gap-6"
                        >
                          <span className="relative block h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border">
                            <Image
                              src={o.supply.imageUrl}
                              alt={`${o.supply.name} in ${o.supply.supplier.town}, ${o.supply.supplier.region}`}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                              <span className="font-display text-2xl leading-none tracking-tight text-ink dark:text-cream">
                                {o.supply.name}
                              </span>
                              <span className="ax-data text-xs text-muted-foreground">
                                {formatKg(o.quantityKg)} · {o.code}
                              </span>
                            </span>
                            <span className="mt-1.5 block truncate text-xs text-muted-foreground">
                              {o.supply.supplier.name} → {o.destination}
                            </span>
                          </span>

                          <span className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-6">
                            <StatusBadge status={o.status} />
                            <span className="ax-data hidden text-sm text-ink dark:text-cream sm:block">
                              {formatCedis(orderTotal(o), 0)}
                            </span>
                            <ArrowLink onClick={() => openOrder(o.id)}>Track</ArrowLink>
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            {/* ── Analytics ────────────────────────────────────────────────── */}
            <section
              aria-labelledby="analytics-heading"
              className="border-t border-border py-14 sm:py-16 lg:py-20"
            >
              <Eyebrow>Procurement analytics</Eyebrow>
              <h2
                id="analytics-heading"
                className="mt-4 font-display text-3xl leading-[1.05] tracking-tight text-ink dark:text-cream sm:text-4xl"
              >
                Where your cedis <span className="italic">go.</span>
              </h2>

              <div className="mt-10 grid gap-x-12 gap-y-14 lg:grid-cols-2">
                {/* Spend by commodity */}
                <div>
                  <h3 className="ax-label text-foreground">Spend by commodity</h3>
                  <ul className="mt-6 flex flex-col gap-5">
                    {commoditySpend.map(([name, total]) => (
                      <li key={name}>
                        <div className="flex items-baseline justify-between gap-4">
                          <span className="text-xs text-foreground">{name}</span>
                          <span className="ax-data text-xs text-muted-foreground">
                            {formatCedis(total, 0)}
                          </span>
                        </div>
                        <div
                          className="mt-2 h-2 w-full rounded-sm bg-forest/10 dark:bg-cream/10"
                          role="img"
                          aria-label={`${name}: ${formatCedis(total, 0)} of ${formatCedis(maxCommoditySpend, 0)} peak spend`}
                        >
                          <div
                            className="h-full rounded-sm bg-forest transition-all duration-500 dark:bg-olive-light"
                            style={{ width: `${Math.max(2, (total / maxCommoditySpend) * 100)}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Spend over time, custom SVG, no chart library */}
                <div>
                  <h3 className="ax-label text-foreground">Spend over time</h3>
                  <svg
                    viewBox="0 0 300 132"
                    className="mt-6 h-auto w-full max-w-lg"
                    role="img"
                    aria-label={`Monthly spend over the last six months, peaking at ${formatCedis(maxMonthlySpend, 0)}`}
                  >
                    {/* baseline */}
                    <line x1="0" y1="100.5" x2="300" y2="100.5" className="stroke-border" strokeWidth="1" />
                    {monthlySpend.map((m, i) => {
                      const x = i * 50 + 12;
                      const h = m.total > 0 ? Math.max(4, (m.total / maxMonthlySpend) * 72) : 0;
                      const y = 100 - h;
                      return (
                        <g key={`${m.label}-${i}`}>
                          {/* hover target covers the full column */}
                          <rect x={x} y="18" width="26" height="82" fill="transparent">
                            <title>{`${m.label}: ${formatCedis(m.total, 0)}`}</title>
                          </rect>
                          {h > 0 && (
                            <>
                              <rect
                                x={x}
                                y={y}
                                width="26"
                                height={h}
                                rx="2"
                                className="fill-forest/85 transition-colors hover:fill-forest dark:fill-gold/80 dark:hover:fill-gold"
                              >
                                <title>{`${m.label}: ${formatCedis(m.total, 0)}`}</title>
                              </rect>
                              <text
                                x={x + 13}
                                y={y - 6}
                                textAnchor="middle"
                                className="ax-data fill-muted-foreground text-[9px]"
                              >
                                {compactCedis(m.total)}
                              </text>
                            </>
                          )}
                          <text
                            x={x + 13}
                            y="116"
                            textAnchor="middle"
                            className="ax-data fill-muted-foreground text-[9px]"
                          >
                            {m.label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                  <p className="mt-3 text-[10px] text-muted-foreground">
                    Monthly totals incl. delivery fees · hover bars for exact figures
                  </p>
                </div>

                {/* Average purchase price per kg */}
                <div>
                  <h3 className="ax-label text-foreground">Average purchase price /kg</h3>
                  <ul className="mt-4">
                    {priceStats.map((p) => (
                      <li
                        key={p.name}
                        className="flex items-baseline justify-between gap-4 border-b border-border py-3.5 first:border-t"
                      >
                        <span className="text-sm text-foreground">{p.name}</span>
                        <span className="text-right">
                          <span className="ax-data block text-sm text-ink dark:text-cream">
                            {formatCedis(p.avg)}
                          </span>
                          <span className="block text-[10px] text-muted-foreground">
                            last: {formatCedis(p.last)}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Supplier performance */}
                <div>
                  <h3 className="ax-label text-foreground">Supplier performance</h3>
                  <ul className="mt-4">
                    {supplierStats.rows.map((s) => (
                      <li
                        key={s.name}
                        className="flex flex-col gap-2.5 border-b border-border py-4 first:border-t"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                          <span className="text-sm text-foreground">{s.name}</span>
                          <span className="ax-data text-xs text-muted-foreground">
                            {s.count} {s.count === 1 ? "order" : "orders"} ·{" "}
                            {formatCedis(s.total, 0)}
                          </span>
                        </div>
                        <div
                          className="h-1.5 w-full rounded-sm bg-forest/10 dark:bg-cream/10"
                          role="img"
                          aria-label={`${s.name}: ${Math.round((s.total / supplierStats.grand) * 100)} percent of total spend`}
                        >
                          <div
                            className="h-full rounded-sm bg-terracotta transition-all duration-500 dark:bg-gold"
                            style={{
                              width: `${Math.max(2, (s.total / supplierStats.grand) * 100)}%`,
                            }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* ── Order history ────────────────────────────────────────────── */}
            <section
              aria-labelledby="history-heading"
              className="border-t border-border py-14 sm:py-16 lg:py-20"
            >
              <Eyebrow>Order history</Eyebrow>
              <h2
                id="history-heading"
                className="mt-4 font-display text-3xl leading-[1.05] tracking-tight text-ink dark:text-cream sm:text-4xl"
              >
                Every order, <span className="italic">on record.</span>
              </h2>

              <div
                className={cn("mt-8", orders.length > 12 && "ax-scroll max-h-96 overflow-y-auto")}
              >
                {/* Desktop table */}
                <table className="hidden w-full text-sm md:table">
                  <thead>
                    <tr className="border-b border-border">
                      {["Date", "Commodity", "Supplier", "Destination", "Total", "Status"].map(
                        (h, i) => (
                          <th
                            key={h}
                            scope="col"
                            className={cn(
                              "ax-label px-3 py-3 text-left text-[10px] font-semibold text-muted-foreground",
                              i === 0 && "pl-0",
                              i === 5 && "pr-0 text-right",
                            )}
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr
                        key={o.id}
                        onClick={() => openOrder(o.id)}
                        className="cursor-pointer border-b border-border transition-colors hover:bg-forest/[0.03] dark:hover:bg-cream/[0.04]"
                      >
                        <td className="px-3 py-4 pl-0">
                          <span className="ax-data text-xs text-muted-foreground">
                            {format(new Date(o.createdAt), "d MMM")}
                          </span>
                        </td>
                        <td className="px-3 py-4">
                          <button
                            type="button"
                            onClick={() => openOrder(o.id)}
                            aria-label={`Open order ${o.code}, ${o.supply.name}`}
                            className="cursor-pointer text-left"
                          >
                            <span className="font-display text-lg leading-none tracking-tight text-ink dark:text-cream">
                              {o.supply.name}
                            </span>
                            <span className="ax-data ml-2.5 text-xs text-muted-foreground">
                              {formatKg(o.quantityKg)}
                            </span>
                          </button>
                        </td>
                        <td className="px-3 py-4 text-xs text-muted-foreground">
                          {o.supply.supplier.name}
                        </td>
                        <td className="max-w-44 truncate px-3 py-4 text-xs text-muted-foreground">
                          {o.destination}
                        </td>
                        <td className="px-3 py-4">
                          <span className="ax-data text-xs text-ink dark:text-cream">
                            {formatCedis(orderTotal(o))}
                          </span>
                        </td>
                        <td className="px-3 py-4 pr-0 text-right">
                          <StatusBadge status={o.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Mobile stacked rows */}
                <ul className="md:hidden">
                  {orders.map((o) => (
                    <li key={o.id} className="border-b border-border first:border-t">
                      <button
                        type="button"
                        onClick={() => openOrder(o.id)}
                        aria-label={`Open order ${o.code}, ${o.supply.name}`}
                        className="w-full cursor-pointer px-1 py-4 text-left transition-colors hover:bg-forest/[0.03] dark:hover:bg-cream/[0.04]"
                      >
                        <span className="flex items-baseline justify-between gap-3">
                          <span className="font-display text-xl leading-none tracking-tight text-ink dark:text-cream">
                            {o.supply.name}
                          </span>
                          <span className="ax-data text-sm text-ink dark:text-cream">
                            {formatCedis(orderTotal(o))}
                          </span>
                        </span>
                        <span className="ax-data mt-2 block text-xs text-muted-foreground">
                          {format(new Date(o.createdAt), "d MMM")} · {formatKg(o.quantityKg)} ·{" "}
                          {o.code}
                        </span>
                        <span className="mt-1 block truncate text-xs text-muted-foreground">
                          {o.supply.supplier.name} → {o.destination}
                        </span>
                        <span className="mt-2.5 block">
                          <StatusBadge status={o.status} />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
