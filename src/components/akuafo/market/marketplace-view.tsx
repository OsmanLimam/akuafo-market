"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Search, SearchX, SlidersHorizontal } from "lucide-react";
import { useAkuafo, type MarketFilters } from "../store";
import { GhanaMap } from "../map/ghana-map";
import {
  CtaOutline,
  CtaPrimary,
  DataKey,
  EmptyState,
  ErrorState,
  Eyebrow,
  MarketSkeleton,
} from "../ui";
import { SupplyRow } from "./supply-row";
import {
  CATEGORY_LABEL,
  formatCedis,
  formatKg,
  GHANA_REGIONS,
  GRADE_LABEL,
  type Supply,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/* ── Query ────────────────────────────────────────────────────────────── */

function buildParams(f: MarketFilters): string {
  const p = new URLSearchParams();
  if (f.q.trim()) p.set("q", f.q.trim());
  if (f.region) p.set("region", f.region);
  if (f.category) p.set("category", f.category);
  if (f.grade) p.set("grade", f.grade);
  if (f.minQty && f.minQty > 0) p.set("minQty", String(f.minQty));
  if (f.maxPrice && f.maxPrice > 0) p.set("maxPrice", String(f.maxPrice));
  if (f.deliveryOnly) p.set("delivery", "true");
  if (f.verifiedOnly) p.set("verified", "true");
  p.set("sort", f.sort || "relevance");
  return p.toString();
}

async function fetchSupplies(f: MarketFilters): Promise<Supply[]> {
  const res = await fetch(`/api/supplies?${buildParams(f)}`);
  if (!res.ok) throw new Error("Failed to load supplies");
  const data = await res.json();
  return data.supplies as Supply[];
}

const SORTS = [
  { value: "relevance", label: "Relevance" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "qty_desc", label: "Quantity: largest" },
];

const selectTriggerCls =
  "ax-label h-11 w-full cursor-pointer rounded-lg border-forest/30 bg-transparent text-[11px] text-foreground shadow-xs hover:border-forest/60 focus:ring-terracotta dark:border-cream/30 dark:hover:border-cream/60";

/* ── Numeric filter field (keeps raw text, syncs parsed number) ───────── */

function NumberField({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder: string;
}) {
  const [text, setText] = useState(value == null ? "" : String(value));
  const [prevValue, setPrevValue] = useState(value);

  // Adjust local text when the store resets the value externally.
  if (value !== prevValue) {
    setPrevValue(value);
    setText(value == null ? "" : String(value));
  }

  return (
    <Input
      id={id}
      type="text"
      inputMode="decimal"
      value={text}
      placeholder={placeholder}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^\d.]/g, "");
        const parsed = Number(raw);
        setText(raw);
        onChange(raw && Number.isFinite(parsed) && parsed > 0 ? parsed : null);
      }}
      className="ax-data h-11 rounded-lg border-forest/30 bg-transparent text-sm shadow-none focus-visible:ring-terracotta dark:border-cream/30"
    />
  );
}

/* ── Filter controls (desktop rail + mobile sheet) ────────────────────── */

function FilterControls() {
  const filters = useAkuafo((s) => s.filters);
  const setFilters = useAkuafo((s) => s.setFilters);

  return (
    <div className="flex flex-col gap-7">
      {/* Group, the produce */}
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2.5">
          <DataKey>Commodity</DataKey>
          <Select
            value={filters.category || "ALL"}
            onValueChange={(v) => setFilters({ category: v === "ALL" ? "" : v })}
          >
            <SelectTrigger className={selectTriggerCls} aria-label="Filter by commodity">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              <SelectItem value="ALL" className="rounded-md">
                All commodities
              </SelectItem>
              {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value} className="rounded-md">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2.5">
          <DataKey>Region</DataKey>
          <Select
            value={filters.region || "ALL"}
            onValueChange={(v) => setFilters({ region: v === "ALL" ? "" : v })}
          >
            <SelectTrigger className={selectTriggerCls} aria-label="Filter by region">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              <SelectItem value="ALL" className="rounded-md">
                All regions
              </SelectItem>
              {GHANA_REGIONS.map((r) => (
                <SelectItem key={r} value={r} className="rounded-md">
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2.5">
          <DataKey>Quality</DataKey>
          <Select
            value={filters.grade || "ALL"}
            onValueChange={(v) => setFilters({ grade: v === "ALL" ? "" : v })}
          >
            <SelectTrigger className={selectTriggerCls} aria-label="Filter by quality grade">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              <SelectItem value="ALL" className="rounded-md">
                All grades
              </SelectItem>
              {Object.entries(GRADE_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value} className="rounded-md">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Hairline between groups */}
      <div className="h-px bg-border" aria-hidden />

      {/* Group, the numbers */}
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2.5">
          <label htmlFor="filter-min-qty" className="ax-label text-muted-foreground">
            Min quantity KG
          </label>
          <NumberField
            id="filter-min-qty"
            value={filters.minQty}
            onChange={(minQty) => setFilters({ minQty })}
            placeholder="e.g. 500"
          />
        </div>

        <div className="flex flex-col gap-2.5">
          <label htmlFor="filter-max-price" className="ax-label text-muted-foreground">
            Max price GH₵/KG
          </label>
          <NumberField
            id="filter-max-price"
            value={filters.maxPrice}
            onChange={(maxPrice) => setFilters({ maxPrice })}
            placeholder="e.g. 8.50"
          />
        </div>
      </div>

      {/* Hairline between groups */}
      <div className="h-px bg-border" aria-hidden />

      {/* Group, the supplier */}
      <fieldset className="flex flex-col gap-4">
        <legend className="ax-label text-muted-foreground">Supplier</legend>
        <label className="flex cursor-pointer items-center gap-3 text-sm text-foreground">
          <Checkbox
            checked={filters.verifiedOnly}
            onCheckedChange={(v) => setFilters({ verifiedOnly: v === true })}
            className="rounded-md"
            aria-label="Verified suppliers only"
          />
          Verified suppliers only
        </label>
        <label className="flex cursor-pointer items-center gap-3 text-sm text-foreground">
          <Checkbox
            checked={filters.deliveryOnly}
            onCheckedChange={(v) => setFilters({ deliveryOnly: v === true })}
            className="rounded-md"
            aria-label="Delivery available"
          />
          Delivery available
        </label>
      </fieldset>
    </div>
  );
}

/* ── Compact row for the map view side list ───────────────────────────── */

function CompactRow({ supply, onOpen }: { supply: Supply; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`View supply: ${supply.name}, ${supply.supplier.town}, ${supply.supplier.region}`}
      className="flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-forest/[0.03] dark:hover:bg-cream/[0.04]"
    >
      <span className="min-w-0">
        <span className="block truncate font-display text-lg leading-none text-ink dark:text-cream">
          {supply.name}
        </span>
        <span className="ax-data mt-1.5 block text-[11px] text-muted-foreground">
          {supply.supplier.town} · {formatKg(supply.quantityKg)}
        </span>
      </span>
      <span className="ax-data shrink-0 text-sm font-medium text-ink dark:text-cream">
        {formatCedis(supply.pricePerKg)}
        <span className="text-[10px] font-normal text-muted-foreground"> /KG</span>
      </span>
    </button>
  );
}

/* ── Marketplace view ─────────────────────────────────────────────────── */

export function MarketplaceView() {
  const filters = useAkuafo((s) => s.filters);
  const setFilters = useAkuafo((s) => s.setFilters);
  const resetFilters = useAkuafo((s) => s.resetFilters);
  const marketMode = useAkuafo((s) => s.marketMode);
  const setMarketMode = useAkuafo((s) => s.setMarketMode);
  const openSupply = useAkuafo((s) => s.openSupply);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["supplies", filters],
    queryFn: () => fetchSupplies(filters),
    placeholderData: keepPreviousData,
  });

  const results = data ?? [];

  return (
    <main
      id="main"
      className="mx-auto max-w-[1440px] px-4 pb-20 pt-24 sm:px-6 sm:pt-28 lg:px-10"
    >
      {/* Page header */}
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div>
          <Eyebrow>Marketplace</Eyebrow>
          <h1 className="mt-4 font-display text-5xl leading-[1.02] tracking-tight text-ink dark:text-cream sm:text-6xl">
            All <span className="italic">supply</span>
          </h1>
        </div>
        <p className="ax-data pb-1 text-xs text-muted-foreground" aria-live="polite">
          {results.length} {results.length === 1 ? "LOT" : "LOTS"} LISTED
        </p>
      </header>

      {/* Search */}
      <div className="mt-8 flex items-center gap-4 border-b-2 border-forest pb-3 transition-colors focus-within:border-terracotta dark:border-cream dark:focus-within:border-gold">
        <Search className="h-6 w-6 shrink-0 text-forest dark:text-cream" strokeWidth={1.5} aria-hidden />
        <input
          type="search"
          value={filters.q}
          onChange={(e) => setFilters({ q: e.target.value })}
          placeholder="Search tomatoes, maize, cassava…"
          aria-label="Search supply"
          className="w-full bg-transparent font-display text-2xl italic tracking-tight text-ink placeholder:text-ink/35 focus:outline-none dark:text-cream dark:placeholder:text-cream/30"
        />
      </div>

      {/* Body */}
      <div className="mt-10 grid gap-10 lg:grid-cols-12">
        {/* Desktop filter rail */}
        <aside className="hidden lg:col-span-3 lg:block" aria-label="Filters">
          <div className="sticky top-24 flex flex-col gap-8">
            <FilterControls />
            <CtaOutline className="w-full" onClick={resetFilters}>
              Clear filters
            </CtaOutline>
          </div>
        </aside>

        {/* Results */}
        <section aria-label="Search results" className="lg:col-span-9">
          {/* Controls row */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <Button
              variant="outline"
              onClick={() => setFiltersOpen(true)}
              aria-label="Open filters"
              className="ax-label h-10 cursor-pointer rounded-lg border-forest/40 px-4 text-[11px] shadow-none hover:bg-forest/5 dark:border-cream/40 dark:hover:bg-cream/10 lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              Filters
            </Button>

            <div className="flex flex-wrap items-center gap-3 sm:ml-auto">
              <Select value={filters.sort} onValueChange={(sort) => setFilters({ sort })}>
                <SelectTrigger
                  className={cn(
                    "ax-label h-10 w-[180px] cursor-pointer rounded-lg border-forest/30 bg-transparent text-[11px] text-foreground shadow-xs hover:border-forest/60 focus:ring-terracotta dark:border-cream/30 dark:hover:border-cream/60 sm:w-[210px]",
                  )}
                  aria-label="Sort results"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  {SORTS.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="rounded-md">
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div
                className="flex rounded-lg border border-border p-0.5"
                role="group"
                aria-label="Result view"
              >
                {(["list", "map"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMarketMode(m)}
                    aria-pressed={marketMode === m}
                    className={cn(
                      "ax-label h-9 cursor-pointer rounded-md px-4 uppercase transition-colors",
                      marketMode === m
                        ? "bg-forest text-cream dark:bg-cream dark:text-ink"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* States */}
          {isLoading && <MarketSkeleton rows={6} />}
          {isError && <ErrorState thing="the marketplace" onRetry={() => refetch()} />}
          {!isLoading && !isError && results.length === 0 && (
            <EmptyState
              icon={SearchX}
              title="Nothing matched your search."
              description="Try changing location, reducing quantity, or removing a filter."
              actionLabel="Clear filters"
              onAction={resetFilters}
            />
          )}
          {!isLoading && !isError && results.length > 0 && marketMode === "list" && (
            <div className="border-t border-border">
              {results.map((s) => (
                <SupplyRow key={s.id} supply={s} />
              ))}
            </div>
          )}
          {!isLoading && !isError && results.length > 0 && marketMode === "map" && (
            <div className="mt-6 grid gap-6 lg:grid-cols-12">
              <div className="rounded-xl border border-border bg-card p-4 lg:col-span-8">
                <GhanaMap supplies={results} onSelectSupply={(s) => openSupply(s.id)} />
              </div>
              <div className="lg:col-span-4">
                <p className="ax-data mb-3 text-xs text-muted-foreground" aria-live="polite">
                  {results.length} {results.length === 1 ? "LOT" : "LOTS"} ON THE MAP
                </p>
                <div className="ax-scroll max-h-[380px] divide-y divide-border overflow-y-auto rounded-xl border border-border lg:max-h-[560px]">
                  {results.map((s) => (
                    <CompactRow key={s.id} supply={s} onOpen={() => openSupply(s.id)} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Mobile filter sheet */}
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent
          side="left"
          className="w-[86vw] max-w-sm gap-0 border-border p-0 [&>button]:rounded-md"
        >
          <div className="flex items-center justify-between border-b border-border p-5 pr-12">
            <SheetTitle className="ax-label text-ink dark:text-cream">Filters</SheetTitle>
            <SheetDescription className="sr-only">
              Filter marketplace supply by commodity, region, quantity, quality and fulfilment.
            </SheetDescription>
          </div>
          <div className="ax-scroll flex-1 overflow-y-auto p-5">
            <FilterControls />
          </div>
          <div className="flex gap-3 border-t border-border p-5">
            <CtaOutline className="flex-1 px-4" onClick={resetFilters}>
              Clear filters
            </CtaOutline>
            <CtaPrimary className="flex-1 px-4" onClick={() => setFiltersOpen(false)}>
              Apply
            </CtaPrimary>
          </div>
        </SheetContent>
      </Sheet>
    </main>
  );
}
