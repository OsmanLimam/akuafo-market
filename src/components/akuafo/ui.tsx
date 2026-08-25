"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useSpring } from "framer-motion";
import { ArrowRight, BadgeCheck, RotateCcw, Sprout } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatKg } from "@/lib/types";
import { cn } from "@/lib/utils";

export { Wordmark, Logo, AkuafoMark } from "./logo";

/* ── Animated number (spring-driven, reduced-motion safe) ─────────────── */

export function AnimatedNumber({
  value,
  format = (n) => Math.round(n).toLocaleString("en-GH"),
  className,
}: {
  value: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const [text, setText] = useState(() => format(value));
  const mv = useMotionValue(value);
  const spring = useSpring(mv, { stiffness: 140, damping: 24, mass: 0.6 });

  useMotionValueEvent(spring, "change", (v) => setText(format(v)));

  useEffect(() => {
    if (reduced) {
      setText(format(value));
      mv.set(value);
      spring.jump(value);
    } else {
      mv.set(value);
    }
  }, [value, reduced]);

  return (
    <span className={cn("tabular-nums", className)} aria-live="off">
      {text}
    </span>
  );
}

/* ── Section chrome ───────────────────────────────────────────────────── */

export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("ax-label flex items-center gap-2.5 text-terracotta-deep dark:text-terracotta", className)}>
      <span className="inline-block h-px w-5 bg-current opacity-80" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  className,
  light,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  className?: string;
  light?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2
        className={cn(
          "font-display text-4xl leading-[1.04] tracking-tight sm:text-5xl lg:text-6xl",
          light ? "text-cream" : "text-ink dark:text-cream",
        )}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

/* ── Links & buttons ──────────────────────────────────────────────────── */

export function ArrowLink({
  children,
  onClick,
  light,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  light?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "ax-label group inline-flex cursor-pointer items-center gap-2 py-1 text-[11px]",
        light
          ? "text-cream hover:text-gold"
          : "text-forest hover:text-terracotta-deep dark:text-cream dark:hover:text-terracotta",
        className,
      )}
    >
      <span className="border-b border-transparent pb-0.5 transition-colors group-hover:border-current">
        {children}
      </span>
      <ArrowRight
        className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1"
        strokeWidth={1.75}
        aria-hidden
      />
    </button>
  );
}

export function CtaPrimary({
  children,
  onClick,
  className,
  type = "button",
  disabled,
  loading,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "ax-label h-12 cursor-pointer rounded-lg bg-forest px-7 text-[11.5px] text-cream shadow-none transition-all hover:bg-forest-mid active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:bg-cream dark:text-ink dark:hover:bg-white dark:focus-visible:ring-gold",
        className,
      )}
    >
      {loading && (
        <span
          className="mr-2 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden
        />
      )}
      {children}
      {!loading && (
        <ArrowRight className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      )}
    </Button>
  );
}

export function CtaOutline({
  children,
  onClick,
  className,
  light,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  light?: boolean;
}) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className={cn(
        "ax-label h-12 cursor-pointer rounded-lg border bg-transparent px-7 text-[11.5px] shadow-none transition-all active:scale-[0.98]",
        light
          ? "border-cream/40 text-cream hover:border-cream hover:bg-cream/10 hover:text-cream"
          : "border-forest/35 text-forest hover:border-forest hover:bg-forest/5 dark:border-cream/40 dark:text-cream dark:hover:border-cream dark:hover:bg-cream/10",
        className,
      )}
    >
      {children}
    </Button>
  );
}

/* ── Data display ─────────────────────────────────────────────────────── */

export function DataKey({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("ax-label text-muted-foreground", className)}>{children}</span>;
}

export function StatBlock({
  label,
  value,
  sub,
  mono = true,
  className,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2 border-t border-border pt-4", className)}>
      <DataKey>{label}</DataKey>
      <span
        className={cn(
          "text-3xl font-medium leading-none tracking-tight text-ink dark:text-cream",
          mono ? "ax-data" : "font-display",
        )}
      >
        {value}
      </span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  );
}

export function VerifiedMark({ light, className }: { light?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        light ? "text-cream" : "text-ink dark:text-cream",
        className,
      )}
    >
      <BadgeCheck className="h-4 w-4 text-terracotta dark:text-gold" strokeWidth={1.75} aria-hidden />
      <span className="ax-label text-[10px]">Verified supplier</span>
    </span>
  );
}

/* ── Signature supply meter ───────────────────────────────────────────── */

export function SupplyMeter({
  total,
  available,
  selected = 0,
  size = "md",
  className,
}: {
  total: number;
  available: number;
  selected?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const committed = Math.max(0, total - available);
  const request = Math.min(selected, available);
  const remaining = Math.max(0, available - request);
  const pctCommitted = total > 0 ? (committed / total) * 100 : 0;
  const pctRequest = total > 0 ? (request / total) * 100 : 0;
  const pctRemaining = total > 0 ? (remaining / total) * 100 : 0;
  const big = size === "lg";

  return (
    <div className={cn("flex w-full flex-col gap-4", className)} aria-live="polite">
      {/* Labeled figures */}
      <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
        <div className="flex flex-col gap-1">
          <DataKey>Available</DataKey>
          <span
            className={cn(
              "ax-data font-medium leading-none text-ink dark:text-cream",
              big ? "text-4xl" : "text-2xl",
            )}
          >
            {formatKg(available)}
          </span>
        </div>
        {selected > 0 && (
          <div className="flex flex-col gap-1">
            <DataKey className="text-terracotta-deep dark:text-terracotta">Your request</DataKey>
            <span
              className={cn(
                "ax-data font-medium leading-none text-terracotta-deep dark:text-terracotta",
                big ? "text-4xl" : "text-2xl",
              )}
            >
              {formatKg(request)}
            </span>
          </div>
        )}
        {selected > 0 && (
          <div className="flex flex-col gap-1">
            <DataKey>Remaining after</DataKey>
            <span
              className={cn(
                "ax-data font-medium leading-none text-muted-foreground",
                big ? "text-4xl" : "text-2xl",
              )}
            >
              {formatKg(remaining)}
            </span>
          </div>
        )}
      </div>

      {/* The bar: committed | request | remaining */}
      <div
        className={cn("flex w-full gap-[3px]", big ? "h-5" : size === "sm" ? "h-2.5" : "h-3.5")}
        role="img"
        aria-label={`${available} of ${total} kilograms available${selected ? `, your request ${selected} kilograms, ${remaining} would remain` : ""}`}
      >
        <div
          className="rounded-sm bg-forest/15 transition-[width] duration-500 dark:bg-cream/15"
          style={{ width: `${pctCommitted}%` }}
          title="Already committed to other buyers"
        />
        <div
          className="rounded-sm bg-terracotta transition-[width] duration-500 dark:bg-terracotta"
          style={{ width: `${pctRequest}%` }}
          title="Your request"
        />
        <div
          className="rounded-sm bg-forest transition-[width] duration-500 dark:bg-olive-light"
          style={{ width: `${pctRemaining}%` }}
          title="Available"
        />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
        <span className="ax-data text-[11px] text-muted-foreground">
          {Math.round((available / Math.max(total, 1)) * 100)}% of lot available
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-[2px] bg-forest dark:bg-olive-light" aria-hidden />
          <span className="ax-label text-[9px] text-muted-foreground">Available</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-[2px] bg-terracotta" aria-hidden />
          <span className="ax-label text-[9px] text-muted-foreground">Your request</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-[2px] bg-forest/15 dark:bg-cream/15" aria-hidden />
          <span className="ax-label text-[9px] text-muted-foreground">Committed</span>
        </span>
      </div>
    </div>
  );
}

/* ── Status ───────────────────────────────────────────────────────────── */

const STATUS_STYLE: Record<string, { dot: string; label: string }> = {
  REQUESTED: { dot: "bg-olive", label: "text-muted-foreground" },
  CONFIRMED: { dot: "bg-forest dark:bg-olive-light", label: "text-forest dark:text-cream" },
  PREPARING: { dot: "bg-terracotta", label: "text-terracotta-deep dark:text-terracotta" },
  READY: { dot: "bg-gold", label: "text-terracotta-deep dark:text-terracotta" },
  IN_TRANSIT: { dot: "bg-terracotta", label: "text-terracotta-deep dark:text-terracotta" },
  DELIVERED: { dot: "bg-forest dark:bg-olive-light", label: "text-forest dark:text-cream" },
  CANCELLED: { dot: "bg-destructive", label: "text-destructive" },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.REQUESTED;
  const label = status.replace(/_/g, " ");
  return (
    <span className={cn("ax-label inline-flex items-center gap-2 text-[10px]", s.label, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} aria-hidden />
      {label}
    </span>
  );
}

export function GradeChip({ grade, className }: { grade: string; className?: string }) {
  return (
    <span
      className={cn(
        "ax-label inline-flex items-center rounded-md border border-current px-2 py-1 text-[10px] text-muted-foreground",
        className,
      )}
    >
      {grade === "GRADE_A" ? "Grade A" : grade === "GRADE_B" ? "Grade B" : "Field Run"}
    </span>
  );
}

/* ── States ───────────────────────────────────────────────────────────── */

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  className,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-4 rounded-xl px-6 py-20 text-center", className)}>
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-forest/8 dark:bg-cream/8">
        <Icon className="h-6 w-6 text-olive dark:text-olive-light" strokeWidth={1.25} aria-hidden />
      </span>
      <h3 className="font-display text-3xl tracking-tight text-ink dark:text-cream">{title}</h3>
      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      {(actionLabel || secondaryLabel) && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          {actionLabel && (
            <Button
              onClick={onAction}
              className="ax-label h-11 cursor-pointer rounded-lg bg-forest px-6 text-[11px] text-cream shadow-none transition-all hover:bg-forest-mid active:scale-[0.98] dark:bg-cream dark:text-ink"
            >
              {actionLabel}
            </Button>
          )}
          {secondaryLabel && (
            <Button
              variant="outline"
              onClick={onSecondary}
              className="ax-label h-11 cursor-pointer rounded-lg border-forest/35 px-6 text-[11px] shadow-none hover:bg-forest/5 dark:border-cream/40 dark:hover:bg-cream/10"
            >
              {secondaryLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function ErrorState({
  title = "We couldn't load this",
  thing = "supply",
  onRetry,
  className,
}: {
  title?: string;
  thing?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-4 rounded-xl px-6 py-20 text-center", className)}>
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-terracotta/10">
        <RotateCcw className="h-6 w-6 text-terracotta-deep dark:text-terracotta" strokeWidth={1.25} aria-hidden />
      </span>
      <h3 className="font-display text-3xl tracking-tight text-ink dark:text-cream">
        {title} {thing}
      </h3>
      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
        Please check your connection and try again.
      </p>
      {onRetry && (
        <Button
          onClick={onRetry}
          className="ax-label mt-2 h-11 cursor-pointer rounded-lg bg-forest px-6 text-[11px] text-cream shadow-none transition-all hover:bg-forest-mid active:scale-[0.98] dark:bg-cream dark:text-ink"
        >
          Try again
        </Button>
      )}
    </div>
  );
}

/* ── Skeletons ────────────────────────────────────────────────────────── */

export function MarketSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col" aria-busy="true" aria-label="Loading marketplace">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-6 py-5">
          <Skeleton className="h-20 w-28 shrink-0 rounded-lg" />
          <div className="flex w-full flex-col gap-3">
            <Skeleton className="h-5 w-1/3 rounded-md" />
            <Skeleton className="h-3.5 w-1/2 rounded-md" />
          </div>
          <Skeleton className="ml-auto hidden h-8 w-24 shrink-0 rounded-md sm:block" />
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-2" aria-busy="true" aria-label="Loading supply detail">
      <Skeleton className="aspect-[4/3] w-full rounded-xl" />
      <div className="flex flex-col gap-6 pt-4">
        <Skeleton className="h-4 w-24 rounded-md" />
        <Skeleton className="h-14 w-2/3 rounded-md" />
        <Skeleton className="h-4 w-1/2 rounded-md" />
        <div className="mt-4 flex flex-col gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-label="Loading dashboard">
      <Skeleton className="h-12 w-1/2 rounded-md" />
      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-72 w-full rounded-xl" />
    </div>
  );
}

/* Icons kept for convenience */
export { Sprout };
