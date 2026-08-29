"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { SupplyImage } from "../supply-image";
import { useQuery } from "@tanstack/react-query";
import { Bookmark, PackageX } from "lucide-react";
import { useAkuafo } from "../store";
import { useAuth } from "../auth-store";
import { useSaved } from "../saved-store";
import {
  ArrowLink,
  CtaPrimary,
  DataKey,
  DetailSkeleton,
  EmptyState,
  ErrorState,
  GradeChip,
  SupplyMeter,
  VerifiedMark,
} from "../ui";
import { harvestWindow, initialsOf } from "../market/supply-row";
import { BuyFlow } from "./buy-flow";
import { useToast } from "@/hooks/use-toast";
import { CATEGORY_LABEL, formatCedis, formatKg, type Supply } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ── Query ────────────────────────────────────────────────────────────── */

async function fetchSupply(id: string): Promise<Supply> {
  const res = await fetch(`/api/supplies/${encodeURIComponent(id)}`);
  if (res.status === 404) {
    const err = new Error("Supply not found") as Error & { status?: number };
    err.status = 404;
    throw err;
  }
  if (!res.ok) throw new Error("Failed to load supply");
  const data = await res.json();
  return data.supply as Supply;
}

/** Seed stores fulfilment as a fraction (0.96); render "96%". */
function formatRate(v: number): string {
  const pct = v > 0 && v <= 1 ? Math.round(v * 100) : Math.round(v);
  return `${pct}%`;
}

/* ── Spec sheet row ───────────────────────────────────────────────────── */

function SpecRow({
  label,
  value,
  big = false,
}: {
  label: string;
  value: React.ReactNode;
  big?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border py-3">
      <DataKey>{label}</DataKey>
      <span
        className={cn(
          "ax-data text-right text-ink dark:text-cream",
          big ? "text-lg font-medium" : "text-sm",
        )}
      >
        {value}
      </span>
    </div>
  );
}

/* ── Detail view ──────────────────────────────────────────────────────── */

export function SupplyDetailView() {
  const supplyId = useAkuafo((s) => s.supplyId);
  const openMarket = useAkuafo((s) => s.openMarket);
  const openSupplier = useAkuafo((s) => s.openSupplier);
  const setView = useAkuafo((s) => s.setView);
  const { user, hydrated } = useAuth();
  const setRedirectAfterAuth = useAuth((s) => s.setRedirectAfterAuth);
  const savedSupplies = useSaved((s) => s.supplies);
  const toggleSupply = useSaved((s) => s.toggleSupply);
  const { toast } = useToast();

  const [buyOpen, setBuyOpen] = useState(false);
  const [flowQty, setFlowQty] = useState(0);

  const handleQtyChange = useCallback((n: number) => setFlowQty(n), []);

  const query = useQuery({
    queryKey: ["supply", supplyId],
    queryFn: () => fetchSupply(supplyId!),
    enabled: !!supplyId,
  });

  const supply = query.data;
  const notFound = query.isError && (query.error as { status?: number }).status === 404;
  const saved = supply ? savedSupplies.some((x) => x.id === supply.id) : false;

  const toggleSave = () => {
    if (!supply) return;
    toggleSupply({
      id: supply.id,
      code: supply.code,
      name: supply.name,
      imageUrl: supply.imageUrl,
      pricePerKg: supply.pricePerKg,
      quantityKg: supply.quantityKg,
      town: supply.supplier.town,
      region: supply.supplier.region,
      savedAt: Date.now(),
    });
    toast({ title: saved ? "Removed from saved" : "Saved to your list" });
  };

  /** Requests are for signed-in buyers, gate, then open the flow. */
  const handleRequest = () => {
    if (!supply || supply.quantityKg <= 0) return;
    if (!hydrated) return;
    if (!user) {
      setRedirectAfterAuth("supply");
      setView("signin");
      toast({ title: "Sign in to request produce" });
      return;
    }
    if (user.role === "SUPPLIER") {
      toast({
        title: "You're signed in as a supplier. Requests are for buyer accounts.",
      });
      return;
    }
    setBuyOpen(true);
    setFlowQty(Math.min(supply.minOrderKg, supply.quantityKg));
  };

  /* No id in store, or the lot 404s from the API */
  if (!supplyId || notFound) {
    return (
      <main
        id="main"
        className="mx-auto max-w-[1440px] px-4 pb-20 pt-24 sm:px-6 sm:pt-28 lg:px-10"
      >
        <EmptyState
          icon={PackageX}
          title="This lot is no longer listed."
          description="It may have been fully committed to another buyer. Browse the marketplace for similar supply."
          actionLabel="Back to marketplace"
          onAction={() => openMarket()}
        />
      </main>
    );
  }

  return (
    <main
      id="main"
      className="mx-auto max-w-[1440px] px-4 pb-20 pt-24 sm:px-6 sm:pt-28 lg:px-10"
    >
      <div className="mb-8">
        <ArrowLink onClick={() => openMarket()}>Back to marketplace</ArrowLink>
      </div>

      {query.isLoading && <DetailSkeleton />}
      {query.isError && !notFound && <ErrorState thing="this lot" onRetry={() => query.refetch()} />}

      {supply && (
        <>
          <div className="grid gap-10 lg:grid-cols-12">
            {/* Left, image + description */}
            <div className="lg:col-span-7">
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
                <SupplyImage
                  src={supply.imageUrl}
                  alt={`${supply.name} in ${supply.supplier.town}, ${supply.supplier.region}`}
                  fill
                  priority
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="ax-data text-[11px] text-muted-foreground">{supply.code}</span>
                <span className="text-xs text-muted-foreground">
                  {CATEGORY_LABEL[supply.category] ?? supply.category}
                </span>
                <GradeChip grade={supply.grade} />
              </div>

              <section className="mt-8" aria-labelledby="lot-description">
                <h2 id="lot-description" className="ax-label text-muted-foreground">
                  Lot description
                </h2>
                <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground">
                  {supply.description}
                </p>
              </section>
            </div>

            {/* Right, sticky spec sheet */}
            <div className="lg:col-span-5">
              <div className="lg:sticky lg:top-24">
                <h1 className="font-display text-4xl leading-[1.04] tracking-tight text-ink dark:text-cream sm:text-5xl">
                  {supply.name}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {supply.supplier.town} · {supply.supplier.region}
                </p>

                {/* Price, the number buyers decide on */}
                <div className="mt-4 flex items-baseline justify-between gap-4 border-b border-border pb-3">
                  <DataKey>Price</DataKey>
                  <p className="flex items-baseline gap-1.5">
                    <span className="ax-data text-3xl font-medium leading-none text-ink dark:text-cream">
                      {formatCedis(supply.pricePerKg)}
                    </span>
                    <span className="ax-data text-xs text-muted-foreground">/KG</span>
                  </p>
                </div>

                <SupplyMeter
                  className="mt-4"
                  total={supply.totalQuantityKg}
                  available={supply.quantityKg}
                  selected={flowQty}
                />

                <div className="mt-4">
                  <SpecRow label="Available" value={formatKg(supply.quantityKg)} big />
                  <SpecRow label="Min order" value={formatKg(supply.minOrderKg)} />
                  <SpecRow label="Harvest window" value={harvestWindow(supply)} />
                  <SpecRow
                    label="Delivery"
                    value={supply.deliveryAvailable ? "Delivery available" : "Farm pickup only"}
                  />
                </div>

                {/* Supplier mini-card */}
                <div className="mt-4 rounded-xl border border-border p-4">
                  <div className="flex items-center gap-3">
                    {supply.supplier.imageUrl ? (
                      <span className="relative block h-11 w-11 shrink-0 overflow-hidden rounded-lg">
                        <Image
                          src={supply.supplier.imageUrl}
                          alt={`${supply.supplier.name}, supplier portrait`}
                          fill
                          sizes="44px"
                          className="object-cover"
                        />
                      </span>
                    ) : (
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border font-display text-lg text-forest dark:text-cream">
                        {initialsOf(supply.supplier.name)}
                      </span>
                    )}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <p className="font-display text-xl leading-none text-ink dark:text-cream">
                          {supply.supplier.name}
                        </p>
                        {supply.supplier.verified && <VerifiedMark />}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {supply.supplier.town}, {supply.supplier.region}
                      </p>
                    </div>
                  </div>
                  <p className="ax-data mt-3 text-xs text-muted-foreground">
                    {supply.supplier.completedOrders} ORDERS · {supply.supplier.yearsOperating} YRS
                    · {formatRate(supply.supplier.fulfilmentRate)} FULFILMENT
                  </p>
                  <div className="mt-3">
                    <ArrowLink onClick={() => openSupplier(supply.supplier.id)}>
                      View supplier
                    </ArrowLink>
                  </div>
                </div>

                {/* CTAs */}
                <div className="mt-4 flex gap-3">
                  <CtaPrimary
                    className="flex-1"
                    disabled={supply.quantityKg <= 0}
                    onClick={handleRequest}
                  >
                    {supply.quantityKg <= 0 ? "Lot fully committed" : "Request this lot"}
                  </CtaPrimary>
                  <Button
                    variant="outline"
                    onClick={toggleSave}
                    aria-pressed={saved}
                    aria-label={saved ? "Remove this lot from your saved list" : "Save this lot to your list"}
                    className="h-12 w-12 shrink-0 cursor-pointer rounded-lg border-forest/35 shadow-none transition-all hover:border-forest hover:bg-forest/5 active:scale-[0.98] dark:border-cream/40 dark:hover:border-cream dark:hover:bg-cream/10"
                  >
                    <Bookmark
                      className={cn(
                        "h-5 w-5",
                        saved
                          ? "fill-terracotta text-terracotta"
                          : "text-forest dark:text-cream",
                      )}
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile sticky CTA (above the tab bar) */}
          {supply.quantityKg > 0 && (
            <div className="fixed inset-x-0 bottom-16 z-40 border-t border-border bg-background/95 p-3 backdrop-blur lg:hidden">
              <div className="mx-auto flex max-w-[1440px] items-center gap-4">
                <p className="ax-data shrink-0 text-lg font-medium leading-none text-ink dark:text-cream">
                  {formatCedis(supply.pricePerKg)}
                  <span className="text-xs font-normal text-muted-foreground"> /KG</span>
                </p>
                <CtaPrimary className="flex-1 px-4" onClick={handleRequest}>
                  Request this lot
                </CtaPrimary>
              </div>
            </div>
          )}

          <BuyFlow
            key={supply.id}
            supply={supply}
            open={buyOpen}
            onOpenChange={(open) => {
              setBuyOpen(open);
              setFlowQty(open ? Math.min(supply.minOrderKg, supply.quantityKg) : 0);
            }}
            onQuantityChange={handleQtyChange}
          />
        </>
      )}
    </main>
  );
}
