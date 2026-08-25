"use client";

import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Bookmark, Clock, PackageX } from "lucide-react";
import { useAkuafo } from "../store";
import { useSaved } from "../saved-store";
import {
  ArrowLink,
  DashboardSkeleton,
  EmptyState,
  ErrorState,
  StatBlock,
  VerifiedMark,
} from "../ui";
import { initialsOf, SupplyRow } from "./supply-row";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SupplierProfile } from "@/lib/types";

/* ── Query ────────────────────────────────────────────────────────────── */

async function fetchSupplier(id: string): Promise<SupplierProfile> {
  const res = await fetch(`/api/suppliers/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error("Failed to load supplier");
  const data = await res.json();
  return data.supplier as SupplierProfile;
}

/** Seed stores fulfilment as a fraction (0.96); render "96%". */
function formatRate(v: number): string {
  const pct = v > 0 && v <= 1 ? Math.round(v * 100) : Math.round(v);
  return `${pct}%`;
}

/* ── Verification pending note (new signups awaiting review) ──────────── */

function VerificationPending({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Clock className="h-4 w-4 shrink-0 text-gold" strokeWidth={1.75} aria-hidden />
      <span className="ax-label text-[10px] text-muted-foreground">Verification pending</span>
      <span className="text-xs text-muted-foreground">Supplier verification in review</span>
    </span>
  );
}

/* ── Supplier profile view ────────────────────────────────────────────── */

export function SupplierProfileView() {
  const supplierId = useAkuafo((s) => s.supplierId);
  const openMarket = useAkuafo((s) => s.openMarket);
  const savedSuppliers = useSaved((s) => s.suppliers);
  const toggleSupplier = useSaved((s) => s.toggleSupplier);
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ["supplier", supplierId],
    queryFn: () => fetchSupplier(supplierId!),
    enabled: !!supplierId,
  });

  const supplier = query.data;
  const saved = supplier ? savedSuppliers.some((x) => x.id === supplier.id) : false;

  const toggleSave = () => {
    if (!supplier) return;
    toggleSupplier({
      id: supplier.id,
      code: supplier.code,
      name: supplier.name,
      town: supplier.town,
      region: supplier.region,
      verified: supplier.verified,
      savedAt: Date.now(),
    });
    toast({ title: saved ? "Removed from saved" : "Supplier saved to your list" });
  };

  return (
    <main
      id="main"
      className="mx-auto max-w-[1440px] px-4 pb-20 pt-24 sm:px-6 sm:pt-28 lg:px-10"
    >
      {!supplierId && (
        <EmptyState
          icon={PackageX}
          title="Supplier not found."
          description="This supplier profile is no longer available. Browse the marketplace for verified supply."
          actionLabel="Back to marketplace"
          onAction={() => openMarket()}
        />
      )}

      {supplierId && query.isLoading && <DashboardSkeleton />}
      {query.isError && <ErrorState thing="this supplier" onRetry={() => query.refetch()} />}

      {supplier && (
        <>
          {/* Header row */}
          <header className="flex flex-col gap-5">
            <ArrowLink onClick={() => openMarket()}>Back to marketplace</ArrowLink>
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <h1 className="font-display text-4xl leading-[1.02] tracking-tight text-ink dark:text-cream sm:text-5xl">
                  {supplier.name}
                </h1>
                {supplier.verified ? <VerifiedMark /> : <VerificationPending />}
              </div>
              <Button
                variant="outline"
                onClick={toggleSave}
                aria-pressed={saved}
                className="ax-label h-11 cursor-pointer rounded-lg border-forest/35 px-5 text-[11px] shadow-none transition-all hover:border-forest hover:bg-forest/5 active:scale-[0.98] dark:border-cream/40 dark:hover:border-cream dark:hover:bg-cream/10"
              >
                <Bookmark
                  className={cn(
                    "mr-2 h-4 w-4",
                    saved ? "fill-terracotta text-terracotta" : "text-forest dark:text-cream",
                  )}
                  strokeWidth={1.75}
                  aria-hidden
                />
                {saved ? "Saved supplier" : "Save supplier"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {supplier.type} · {supplier.district} · {supplier.region} · {supplier.town}
            </p>
          </header>

          {/* Portrait + stats */}
          <div className="mt-10 grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-border">
                {supplier.imageUrl ? (
                  <Image
                    src={supplier.imageUrl}
                    alt={`${supplier.name} in ${supplier.type} based in ${supplier.town}, ${supplier.region}`}
                    fill
                    priority
                    sizes="(min-width: 1024px) 30vw, 100vw"
                    className="object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-forest/[0.04] font-display text-8xl text-forest/60 dark:bg-cream/[0.04] dark:text-cream/50">
                    {initialsOf(supplier.name)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col lg:col-span-8">
              <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
                {supplier.description}
              </p>

              <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
                <StatBlock
                  label="Completed orders"
                  value={supplier.completedOrders}
                  sub={supplier.activeOrders > 0 ? `${supplier.activeOrders} in progress` : undefined}
                />
                <StatBlock label="Years operating" value={supplier.yearsOperating} />
                <StatBlock label="Fulfilment rate" value={formatRate(supplier.fulfilmentRate)} />
                <StatBlock label="Response time" value={`~${supplier.responseTimeHrs} HRS`} />
              </div>
            </div>
          </div>

          {/* Current lots */}
          <section className="mt-16 lg:mt-24" aria-labelledby="current-lots">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
              <h2
                id="current-lots"
                className="font-display text-4xl leading-none tracking-tight text-ink dark:text-cream"
              >
                Current <span className="italic">lots</span>
              </h2>
              <p className="ax-data pb-1 text-xs text-muted-foreground">
                {supplier.supplies.length} {supplier.supplies.length === 1 ? "LOT" : "LOTS"} LISTED
              </p>
            </div>

            {supplier.supplies.length === 0 ? (
              <EmptyState
                icon={PackageX}
                title="No lots listed right now."
                description="This supplier has no active listings. Check back soon, or browse the wider marketplace for similar produce."
                actionLabel="Browse marketplace"
                onAction={() => openMarket()}
              />
            ) : (
              <div className="border-t border-border">
                {supplier.supplies.map((s) => (
                  <SupplyRow key={s.id} supply={s} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
