"use client";

import { useMemo } from "react";
import Image from "next/image";
import { format, isAfter } from "date-fns";
import { useAkuafo } from "../store";
import { useSupplies } from "./hero";
import { ArrowLink, EmptyState, ErrorState, Eyebrow, MarketSkeleton } from "../ui";
import { formatCedis, GRADE_LABEL, type Supply } from "@/lib/types";
import { PackageX } from "lucide-react";
import { cn } from "@/lib/utils";

function harvestLabel(s: Supply): string {
  if (!s.harvestStart || !s.harvestEnd) return "Harvest window on request";
  const start = new Date(s.harvestStart);
  const end = new Date(s.harvestEnd);
  if (isAfter(start, new Date())) return `Harvest window ${format(start, "d MMM")} – ${format(end, "d MMM")}`;
  return `Harvested ${format(end, "d MMM yyyy")}`;
}

function SupplyCard({ supply, large = false, className }: { supply: Supply; large?: boolean; className?: string }) {
  const openSupply = useAkuafo((s) => s.openSupply);
  return (
    <article className={cn("group cursor-pointer", className)}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => openSupply(supply.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openSupply(supply.id);
          }
        }}
        className="block w-full cursor-pointer text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-terracotta"
        aria-label={`View ${supply.name} supply from ${supply.supplier.name}`}
      >
        <div className="relative overflow-hidden rounded-lg border border-border">
          <div className={cn("relative", large ? "aspect-[16/10]" : "aspect-[4/3]")}>
            <Image
              src={supply.imageUrl}
              alt={`${supply.name} in ${supply.supplier.town}, ${supply.supplier.region}`}
              fill
              sizes={large ? "(min-width: 768px) 55vw, 100vw" : "(min-width: 768px) 38vw, 100vw"}
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
            />
          </div>
          <span className="ax-data absolute right-3 top-3 rounded-md bg-ink/50 px-2 py-1 text-[10px] text-cream backdrop-blur-sm">
            {supply.code}
          </span>
        </div>

        <div className="mt-4 flex items-baseline justify-between gap-4">
          <h3 className="font-display text-3xl leading-none tracking-tight text-ink dark:text-cream sm:text-4xl">
            {supply.name}
          </h3>
          <p className="ax-data shrink-0 text-lg text-ink dark:text-cream">
            {formatCedis(supply.pricePerKg)}
            <span className="text-xs text-muted-foreground"> /KG</span>
          </p>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
          <span className="ax-data font-medium text-forest dark:text-olive-light">
            {supply.quantityKg.toLocaleString()} KG AVAILABLE
          </span>
          <span aria-hidden>·</span>
          <span>
            {supply.supplier.town} · {supply.supplier.region}
          </span>
          <span aria-hidden>·</span>
          <span>{GRADE_LABEL[supply.grade]}</span>
        </div>

        <p className="mt-1.5 text-xs text-muted-foreground">{harvestLabel(supply)}</p>

        <div className="mt-3 opacity-70 transition-opacity duration-300 group-hover:opacity-100">
          <ArrowLink onClick={() => openSupply(supply.id)}>View supply</ArrowLink>
        </div>
      </div>
    </article>
  );
}

export function AvailableNow() {
  const { data, isLoading, isError, refetch } = useSupplies();
  const openMarket = useAkuafo((s) => s.openMarket);
  const featured = useMemo(() => {
    if (!data?.length) return [];
    const tomatoes = data.find((s) => s.code === "AKM-20491");
    const rest = data.filter((s) => s.code !== "AKM-20491");
    return tomatoes ? [tomatoes, ...rest.slice(0, 3)] : data.slice(0, 4);
  }, [data]);

  return (
    <section className="border-b border-border bg-background" aria-labelledby="available-heading">
      <div className="mx-auto max-w-[1440px] px-4 py-20 sm:px-6 sm:py-24 lg:px-10 lg:py-32">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Eyebrow>Featured supply</Eyebrow>
            <h2
              id="available-heading"
              className="mt-4 font-display text-4xl leading-[1.02] tracking-tight text-ink dark:text-cream sm:text-5xl lg:text-6xl"
            >
              Available <span className="italic">now.</span>
            </h2>
          </div>
          <ArrowLink onClick={() => openMarket()} className="mb-2">
            View all supply
          </ArrowLink>
        </div>

        <div className="mt-12">
          {isLoading && <MarketSkeleton rows={3} />}
          {isError && <ErrorState thing="the marketplace" onRetry={() => refetch()} />}
          {!isLoading && !isError && featured.length === 0 && (
            <EmptyState
              icon={PackageX}
              title="No supply listed yet."
              description="Suppliers are preparing their lots. Check back shortly, or open a request and let suppliers come to you."
              actionLabel="Explore produce"
              onAction={() => openMarket()}
            />
          )}
          {!isLoading && !isError && featured.length > 0 && (
            <div className="grid grid-cols-1 gap-x-6 gap-y-12 md:grid-cols-12">
              <SupplyCard supply={featured[0]} large className="md:col-span-7" />
              {featured[1] && <SupplyCard supply={featured[1]} className="md:col-span-5" />}
              {featured[2] && <SupplyCard supply={featured[2]} className="md:col-span-4" />}
              {featured[3] && <SupplyCard supply={featured[3]} className="md:col-span-4" />}
              {(data?.length ?? 0) > 4 && (
                <button
                  type="button"
                  onClick={() => openMarket()}
                  className="group flex cursor-pointer flex-col justify-between rounded-lg border border-dashed border-forest/30 bg-forest/[0.03] p-6 text-left transition-colors hover:border-forest/60 hover:bg-forest/[0.06] dark:border-cream/25 dark:bg-cream/[0.03] dark:hover:border-cream/50 md:col-span-4"
                >
                  <span className="ax-data text-4xl text-forest dark:text-cream">
                    {data!.length}
                  </span>
                  <span className="mt-6 flex flex-col gap-1">
                    <span className="ax-label text-forest dark:text-cream">Lots listed now</span>
                    <span className="ax-label text-terracotta-deep transition-colors group-hover:text-terracotta dark:text-gold">
                      Browse the full marketplace →
                    </span>
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
