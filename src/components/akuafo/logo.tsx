"use client";

import { cn } from "@/lib/utils";

/* ────────────────────────────────────────────────────────────────────────
   The Akuafo Mark, "The Furrow A"

   Two furrow rows (the legs) rise and converge at a seed diamond (the
   apex, the produce), held together by a market crossbar (the trade
   line connecting farmer to buyer). Geometric, monochrome-capable,
   legible from 16px favicon to full lockup.
   ──────────────────────────────────────────────────────────────────────── */

export function AkuafoMark({
  className,
  title = "Akuafo Market",
}: {
  className?: string;
  title?: string | false;
}) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      className={cn("h-8 w-8", className)}
      role={title ? "img" : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
    >
      {/* left furrow row */}
      <path
        d="M9.5 33.5 L18.4 11.4"
        stroke="currentColor"
        strokeWidth="4.2"
        strokeLinecap="round"
      />
      {/* right furrow row */}
      <path
        d="M30.5 33.5 L21.6 11.4"
        stroke="currentColor"
        strokeWidth="4.2"
        strokeLinecap="round"
      />
      {/* market crossbar, the trade line */}
      <path
        d="M13.7 25.2 L26.3 25.2"
        stroke="currentColor"
        strokeWidth="4.2"
        strokeLinecap="round"
      />
      {/* seed diamond at the apex */}
      <rect
        x="16.55"
        y="5.05"
        width="6.9"
        height="6.9"
        transform="rotate(45 20 8.5)"
        fill="currentColor"
      />
    </svg>
  );
}

/* Primary lockup, mark + wordmark */
export function Logo({
  light = false,
  className,
  compact = false,
}: {
  light?: boolean;
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <AkuafoMark
        className={cn(compact ? "h-6 w-6" : "h-7 w-7", light ? "text-cream" : "text-forest dark:text-cream")}
        title={false}
      />
      {!compact && (
        <span
          className={cn(
            "font-display text-[23px] leading-none tracking-tight",
            light ? "text-cream" : "text-ink dark:text-cream",
          )}
        >
          Akuafo&nbsp;<span className="italic">Market</span>
        </span>
      )}
    </span>
  );
}

/* Back-compat alias: previous components imported Wordmark */
export function Wordmark({ light = false, className }: { light?: boolean; className?: string }) {
  return <Logo light={light} className={className} />;
}
