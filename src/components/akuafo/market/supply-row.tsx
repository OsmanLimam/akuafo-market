"use client";

import { SupplyImage } from "../supply-image";
import { format, isValid } from "date-fns";
import { ArrowRight } from "lucide-react";
import { useAkuafo } from "../store";
import { formatCedis, formatKg, GRADE_LABEL, type Supply } from "@/lib/types";

/* ── Helpers ──────────────────────────────────────────────────────────── */

/** "12–18 Sep" style harvest window (en dash), with a fallback when unknown. */
export function harvestWindow(supply: Pick<Supply, "harvestStart" | "harvestEnd">): string {
  const start = supply.harvestStart ? new Date(supply.harvestStart) : null;
  const end = supply.harvestEnd ? new Date(supply.harvestEnd) : null;
  if (start && end && isValid(start) && isValid(end)) {
    return `${format(start, "d MMM")} – ${format(end, "d MMM")}`;
  }
  return "Harvest on request";
}

/** Up to two initials for portrait placeholders ("Akwasi Farms" → "AF"). */
export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
}

/* ── Editorial hairline result row ────────────────────────────────────── */

/**
 * Shared marketplace list row: rounded thumbnail, serif name, prominent
 * mono quantity + price, muted meta line, "View supply" arrow affordance.
 * Used by the marketplace search results and the supplier profile
 * "Current lots" section.
 */
export function SupplyRow({ supply }: { supply: Supply }) {
  const openSupply = useAkuafo((s) => s.openSupply);

  return (
    <button
      type="button"
      onClick={() => openSupply(supply.id)}
      aria-label={`View supply: ${supply.name} from ${supply.supplier.name}, ${supply.supplier.town}, ${supply.supplier.region}`}
      className="group flex w-full cursor-pointer items-center gap-4 border-b border-border p-4 text-left transition-colors hover:bg-forest/[0.04] focus-visible:bg-forest/[0.04] dark:hover:bg-cream/[0.05] dark:focus-visible:bg-cream/[0.05] sm:gap-6"
    >
      {/* Thumbnail */}
      <span className="relative block h-16 w-16 shrink-0 overflow-hidden rounded-lg sm:h-[88px] sm:w-[88px]">
        <SupplyImage
          src={supply.imageUrl}
          alt={`${supply.name} in ${supply.supplier.town}, ${supply.supplier.region}`}
          fill
          sizes="(min-width: 640px) 88px, 64px"
        />
      </span>

      {/* Name + data line */}
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-display text-2xl leading-none tracking-tight text-ink dark:text-cream">
            {supply.name}
          </span>
          <span className="ax-data text-[11px] text-muted-foreground">{supply.code}</span>
        </span>
        <span className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="ax-data text-sm font-medium text-forest dark:text-olive-light">
            {formatKg(supply.quantityKg)}
          </span>
          <span className="text-muted-foreground" aria-hidden>
            ·
          </span>
          <span className="ax-data text-xs text-muted-foreground">
            {supply.supplier.town} · {supply.supplier.region}
          </span>
          <span className="text-muted-foreground" aria-hidden>
            ·
          </span>
          <span className="ax-data text-xs text-muted-foreground">
            {GRADE_LABEL[supply.grade] ?? supply.grade}
          </span>
          <span className="text-muted-foreground" aria-hidden>
            ·
          </span>
          <span className="ax-data text-xs text-muted-foreground">{harvestWindow(supply)}</span>
        </span>
      </span>

      {/* Price + view CTA */}
      <span className="flex shrink-0 flex-col items-end gap-2">
        <span className="ax-data text-xl font-medium leading-none text-ink dark:text-cream">
          {formatCedis(supply.pricePerKg)}
          <span className="text-xs font-normal text-muted-foreground"> /KG</span>
        </span>
        <span
          className="ax-label inline-flex items-center gap-2 py-1 text-forest transition-transform duration-200 group-hover:translate-x-0.5 dark:text-cream"
          aria-hidden
        >
          <span className="border-b border-transparent pb-0.5">View supply</span>
          <ArrowRight
            className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1"
            strokeWidth={1.75}
          />
        </span>
      </span>
    </button>
  );
}
