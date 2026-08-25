"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { useAkuafo } from "../store";
import { useAuth } from "../auth-store";
import { AnimatedNumber, CtaPrimary, DataKey, SupplyMeter } from "../ui";
import { authFetch } from "@/lib/api-client";
import { formatCedis, formatKg, type Order, type Supply } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
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

/* ── Destination presets with reference delivery fees ─────────────────── */

const DESTINATIONS = [
  { name: "Odorna, Accra", fee: 380 },
  { name: "Kasoa, Central Region", fee: 420 },
  { name: "Tema Community 25", fee: 450 },
  { name: "Adum, Kumasi", fee: 350 },
  { name: "Ho Industrial Area", fee: 750 },
];

const FEE_BY_DESTINATION: Record<string, number> = Object.fromEntries(
  DESTINATIONS.map((d) => [d.name, d.fee]),
);

/** Flat estimate for buyer-entered destinations outside the preset list. */
const CUSTOM_FEE = 420;

const QUICK_QTY = [100, 250, 500, 1000];

const selectTriggerCls =
  "ax-label h-11 w-full cursor-pointer rounded-lg border-forest/30 bg-transparent text-[11px] text-foreground shadow-xs hover:border-forest/60 focus:ring-terracotta dark:border-cream/30 dark:hover:border-cream/60";

/* ── Mobile detection (bottom sheet below sm, side sheet above) ───────── */

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 639px)").matches : false,
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}

/* ── Review row ───────────────────────────────────────────────────────── */

function ReviewRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-border py-3">
      <DataKey className="shrink-0">{label}</DataKey>
      <span className="ax-data min-w-0 text-right text-sm leading-relaxed text-ink dark:text-cream">
        {children}
      </span>
    </div>
  );
}

/* ── Buy flow ─────────────────────────────────────────────────────────── */

export function BuyFlow({
  supply,
  open,
  onOpenChange,
  onQuantityChange,
}: {
  supply: Supply;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Reports the in-flow quantity so the detail page meter can preview it. */
  onQuantityChange?: (qty: number) => void;
}) {
  const isMobile = useIsMobile();
  const reduced = useReducedMotion();
  const queryClient = useQueryClient();
  const openOrder = useAkuafo((s) => s.openOrder);
  const setView = useAkuafo((s) => s.setView);
  const setRedirectAfterAuth = useAuth((s) => s.setRedirectAfterAuth);
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [qty, setQty] = useState(() => Math.min(supply.minOrderKg, supply.quantityKg));
  const [method, setMethod] = useState<"PICKUP" | "DELIVERY" | null>(null);
  const [destination, setDestination] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const productValue = qty * supply.pricePerKg;
  const isPreset = destination in FEE_BY_DESTINATION;
  const deliveryFee =
    method === "PICKUP"
      ? 0
      : destination.trim()
        ? (FEE_BY_DESTINATION[destination] ?? CUSTOM_FEE)
        : 0;
  const qtyTooLow = qty < supply.minOrderKg;
  const qtyTooHigh = qty > supply.quantityKg;

  const canContinue =
    step === 1
      ? !qtyTooLow && !qtyTooHigh
      : step === 2
        ? method !== null
        : step === 3
          ? destination.trim().length > 0
          : true;

  const applyQty = (n: number) => {
    setQty(n);
    onQuantityChange?.(n);
  };

  const stepQty = (delta: number) =>
    applyQty(Math.min(supply.quantityKg, Math.max(supply.minOrderKg, qty + delta)));

  const selectMethod = (m: "PICKUP" | "DELIVERY") => {
    setMethod(m);
    setDestination(m === "PICKUP" ? `${supply.supplier.town} farm gate` : "");
  };

  const next = () => {
    if (step === 1) {
      if (!qtyTooLow && !qtyTooHigh) setStep(2);
    } else if (step === 2) {
      // Pickup skips the destination step (farm gate is the destination).
      setStep(method === "PICKUP" ? 4 : 3);
    } else if (step === 3) {
      if (destination.trim()) setStep(4);
    }
  };

  const back = () => {
    if (step === 4) setStep(method === "PICKUP" ? 2 : 3);
    else if (step > 1) setStep(step - 1);
  };

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await authFetch("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          supplyId: supply.id,
          quantityKg: qty,
          deliveryMethod: method,
          destination: destination.trim(),
          deliveryFee,
        }),
      });

      // Session expired mid-flow, send the buyer back through sign-in.
      if (res.status === 401) {
        onOpenChange(false);
        toast({
          title: "Your session expired. Sign in again.",
          variant: "destructive",
        });
        setRedirectAfterAuth("supply");
        setView("signin");
        return;
      }

      const data = (await res.json().catch(() => null)) as { order?: Order; error?: string } | null;
      if (!res.ok || !data?.order) {
        throw new Error(data?.error ?? "Failed to create request");
      }
      const order = data.order;
      onOpenChange(false);
      toast({
        title: "Request submitted",
        description: `Order ${order.code} is now with ${supply.supplier.name}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["supply", supply.id] });
      queryClient.invalidateQueries({ queryKey: ["supplies"] });
      queryClient.invalidateQueries({ queryKey: ["supplier", supply.supplier.id] });
      openOrder(order.id);
    } catch (e) {
      toast({
        title: "Request failed",
        description:
          e instanceof Error && e.message ? e.message : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={cn(
          "gap-0 border-border p-0 [&>button]:rounded-md",
          isMobile
            ? "max-h-[92svh] rounded-t-2xl"
            : "w-full rounded-l-2xl sm:w-[480px] sm:max-w-[480px]",
        )}
      >
        {/* Header + persistent live summary */}
        <div className="border-b border-border p-5 pr-12 sm:p-6 sm:pr-14">
          <SheetTitle className="font-display text-3xl leading-tight tracking-tight text-ink dark:text-cream">
            {supply.name}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Four-step request flow for lot {supply.code}.
          </SheetDescription>

          {/* Live summary strip, visible on every step */}
          <p
            className="ax-data mt-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs text-muted-foreground"
            aria-live="polite"
          >
            <span>{supply.name}</span>
            <span aria-hidden>·</span>
            <AnimatedNumber
              value={qty}
              format={(n) => `${Math.round(n).toLocaleString("en-GH")} KG`}
              className="font-medium text-forest dark:text-olive-light"
            />
            <span aria-hidden>·</span>
            <AnimatedNumber
              value={productValue}
              format={(n) => formatCedis(n)}
              className="font-medium text-ink dark:text-cream"
            />
            <span>est.</span>
            {method !== null && step >= 2 && (
              <>
                <span aria-hidden>·</span>
                <span className="text-terracotta-deep dark:text-terracotta">
                  {method === "PICKUP" ? "Farm pickup" : "Delivery"}
                </span>
              </>
            )}
          </p>

          <div className="mt-3 flex items-center justify-between gap-4">
            <span className="ax-label text-terracotta-deep dark:text-terracotta">New request</span>
            <span className="ax-data text-[11px] text-muted-foreground" aria-live="polite">
              STEP {step} OF 4
            </span>
          </div>
          <p className="ax-data mt-1.5 text-[11px] text-muted-foreground">{supply.code}</p>
        </div>

        {/* Progress */}
        <div className="flex gap-1 px-5 pt-4 sm:px-6" aria-hidden>
          {[1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full",
                i <= step ? "bg-forest dark:bg-gold" : "bg-forest/15 dark:bg-cream/15",
              )}
            />
          ))}
        </div>

        {/* Steps */}
        <div className="ax-scroll min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={reduced ? false : { opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduced ? undefined : { opacity: 0, x: -12 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {/* Step 1, Quantity */}
              {step === 1 && (
                <div className="flex flex-col gap-6">
                  <SupplyMeter
                    total={supply.totalQuantityKg}
                    available={supply.quantityKg}
                    selected={qty}
                  />

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => stepQty(-50)}
                      disabled={qty <= supply.minOrderKg}
                      aria-label="Decrease quantity by 50 kilograms"
                      className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:border-forest/60 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:border-cream/50"
                    >
                      <Minus className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                    </button>
                    <p
                      className="ax-data flex-1 text-center text-2xl leading-none text-ink dark:text-cream"
                      aria-live="polite"
                    >
                      {qty.toLocaleString("en-GH")} KG
                    </p>
                    <button
                      type="button"
                      onClick={() => stepQty(50)}
                      disabled={qty >= supply.quantityKg}
                      aria-label="Increase quantity by 50 kilograms"
                      className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:border-forest/60 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:border-cream/50"
                    >
                      <Plus className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {QUICK_QTY.map((n) => (
                      <button
                        key={n}
                        type="button"
                        aria-pressed={qty === n}
                        disabled={n > supply.quantityKg}
                        onClick={() => applyQty(n)}
                        className={cn(
                          "ax-data h-9 min-w-[76px] cursor-pointer rounded-lg border px-3 text-xs transition-colors",
                          qty === n
                            ? "border-forest bg-forest/[0.06] text-forest dark:border-gold dark:bg-gold/10 dark:text-gold"
                            : "border-border text-muted-foreground hover:border-forest/50 hover:text-foreground dark:hover:border-cream/50",
                          n > supply.quantityKg && "cursor-not-allowed opacity-40",
                        )}
                      >
                        {n} KG
                      </button>
                    ))}
                  </div>

                  {qtyTooLow && (
                    <p className="text-xs text-destructive" role="alert">
                      Minimum order for this lot is {formatKg(supply.minOrderKg)}.
                    </p>
                  )}
                  {qtyTooHigh && (
                    <p className="text-xs text-destructive" role="alert">
                      Only {formatKg(supply.quantityKg)} remain available on this lot.
                    </p>
                  )}

                  <div className="flex items-baseline justify-between border-t border-border pt-4">
                    <DataKey>Estimated value</DataKey>
                    <AnimatedNumber
                      value={productValue}
                      format={(n) => formatCedis(n)}
                      className="ax-data text-2xl font-medium leading-none text-ink dark:text-cream"
                    />
                  </div>
                </div>
              )}

              {/* Step 2, Delivery method */}
              {step === 2 && (
                <div role="radiogroup" aria-label="Delivery method" className="flex flex-col gap-3">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={method === "PICKUP"}
                    onClick={() => selectMethod("PICKUP")}
                    className={cn(
                      "flex cursor-pointer flex-col gap-2 rounded-xl border p-4 text-left transition-colors",
                      method === "PICKUP"
                        ? "border-forest bg-forest/[0.04] dark:border-cream/70 dark:bg-cream/[0.06]"
                        : "border-border hover:border-forest/50 dark:hover:border-cream/40",
                    )}
                  >
                    <span className="ax-label text-ink dark:text-cream">Pickup</span>
                    <span className="text-sm leading-relaxed text-muted-foreground">
                      Collect at {supply.supplier.town} farm gate ({formatCedis(0)})
                    </span>
                  </button>

                  <button
                    type="button"
                    role="radio"
                    aria-checked={method === "DELIVERY"}
                    onClick={() => selectMethod("DELIVERY")}
                    disabled={!supply.deliveryAvailable}
                    className={cn(
                      "flex cursor-pointer flex-col gap-2 rounded-xl border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                      method === "DELIVERY"
                        ? "border-forest bg-forest/[0.04] dark:border-cream/70 dark:bg-cream/[0.06]"
                        : "border-border hover:border-forest/50 dark:hover:border-cream/40",
                    )}
                  >
                    <span className="ax-label text-ink dark:text-cream">Delivery</span>
                    <span className="text-sm leading-relaxed text-muted-foreground">
                      Delivered to your destination (fee shown next step)
                    </span>
                    {!supply.deliveryAvailable && (
                      <span className="ax-label text-[10px] text-destructive">
                        Not offered for this lot
                      </span>
                    )}
                  </button>
                </div>
              )}

              {/* Step 3, Destination */}
              {step === 3 && (
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2.5">
                    <label htmlFor="dest-preset" className="ax-label text-muted-foreground">
                      Choose a destination
                    </label>
                    <Select
                      value={isPreset ? destination : ""}
                      onValueChange={(v) => setDestination(v)}
                    >
                      <SelectTrigger
                        id="dest-preset"
                        className={selectTriggerCls}
                        aria-label="Preset destinations with estimated delivery fees"
                      >
                        <SelectValue placeholder="Select a destination" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg">
                        {DESTINATIONS.map((d) => (
                          <SelectItem key={d.name} value={d.name} className="rounded-md">
                            {d.name} ({formatCedis(d.fee)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-3" aria-hidden>
                    <span className="h-px flex-1 bg-border" />
                    <span className="ax-label text-muted-foreground">or</span>
                    <span className="h-px flex-1 bg-border" />
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <label htmlFor="dest-custom" className="ax-label text-muted-foreground">
                      Enter your own destination
                    </label>
                    <Input
                      id="dest-custom"
                      type="text"
                      value={isPreset ? "" : destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="e.g. Madina Market, Accra"
                      className="h-11 rounded-lg border-forest/30 bg-transparent text-sm shadow-none focus-visible:ring-terracotta dark:border-cream/30"
                    />
                  </div>

                  <div className="flex items-baseline justify-between border-t border-border pt-4">
                    <DataKey>Delivery (est.)</DataKey>
                    <span className="ax-data text-sm text-ink dark:text-cream">
                      {formatCedis(deliveryFee)}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Estimates for a single drop. The supplier confirms the final fee alongside your
                    request.
                  </p>
                </div>
              )}

              {/* Step 4, Review */}
              {step === 4 && (
                <div className="flex flex-col">
                  <ReviewRow label="Commodity">
                    {supply.name} · {formatKg(qty)}
                  </ReviewRow>
                  <ReviewRow label="Supplier">
                    {supply.supplier.name} · {supply.supplier.town}
                  </ReviewRow>
                  <ReviewRow label="Product value">
                    <AnimatedNumber value={productValue} format={(n) => formatCedis(n)} />
                  </ReviewRow>
                  <ReviewRow label="Delivery">
                    {method === "PICKUP"
                      ? `Farm pickup · ${formatCedis(0)}`
                      : `Delivery to ${destination} · ${formatCedis(deliveryFee)}`}
                  </ReviewRow>

                  <div className="flex items-baseline justify-between gap-6 pt-4">
                    <DataKey>Total</DataKey>
                    <span className="ax-data text-2xl font-medium leading-none text-terracotta-deep dark:text-terracotta">
                      {formatCedis(productValue + deliveryFee)}
                    </span>
                  </div>
                  <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                    Non-binding request: the supplier confirms price and availability before
                    fulfilment.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-border p-4 sm:p-5">
          <Button
            variant="ghost"
            onClick={back}
            disabled={step === 1}
            className="ax-label h-12 cursor-pointer rounded-lg px-5 text-muted-foreground shadow-none hover:text-foreground"
          >
            Back
          </Button>
          <CtaPrimary
            onClick={step === 4 ? submit : next}
            disabled={!canContinue || submitting}
            loading={step === 4 && submitting}
            className="h-12 flex-1 px-6"
          >
            {step === 4 ? (submitting ? "Submitting…" : "Confirm request") : "Continue"}
          </CtaPrimary>
        </div>
      </SheetContent>
    </Sheet>
  );
}
