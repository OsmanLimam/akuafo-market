"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useAkuafo } from "../store";
import { useSupplies } from "./hero";
import { ArrowLink, Eyebrow, SupplyMeter } from "../ui";
import { formatCedis } from "@/lib/types";
import { cn } from "@/lib/utils";

const STEPS = [100, 250, 500, 1000];

export function SupplyViz() {
  const { data } = useSupplies();
  const openSupply = useAkuafo((s) => s.openSupply);
  const tomatoes = data?.find((s) => s.code === "AKM-20491") ?? data?.[0];
  const [qty, setQty] = useState(500);

  const available = tomatoes?.quantityKg ?? 2840;
  const total = tomatoes?.totalQuantityKg ?? 3500;
  const price = tomatoes?.pricePerKg ?? 8.4;
  const clamped = Math.min(Math.max(qty, 0), available);
  const value = clamped * price;

  const adjust = (delta: number) =>
    setQty((q) => Math.min(Math.max(q + delta, 0), available));

  return (
    <section className="bg-forest text-cream" aria-labelledby="viz-heading">
      <div className="mx-auto grid max-w-[1440px] gap-12 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-12 lg:gap-10 lg:px-10 lg:py-32">
        <div className="lg:col-span-5">
          <Eyebrow className="text-gold dark:text-gold">Supply visibility</Eyebrow>
          <h2
            id="viz-heading"
            className="mt-4 font-display text-4xl leading-[1.02] tracking-tight text-cream sm:text-5xl lg:text-6xl"
          >
            See the whole lot,
            <br />
            <span className="italic text-gold">not just a number.</span>
          </h2>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-cream/70">
            Every lot shows how much of the harvest remains and how much is already committed.
            As you build your request, the supply meter responds.
          </p>
          <ul className="mt-8 flex flex-col gap-4">
            {[
              "Reserved quantities update as buyers commit",
              "Harvest windows stated up front",
              "Grade and packing specification on every lot",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3 text-sm text-cream/80">
                <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rotate-45 bg-terracotta" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
          <div className="mt-10">
            <ArrowLink light onClick={() => tomatoes && openSupply(tomatoes.id)}>
              Try it on a live lot
            </ArrowLink>
          </div>
        </div>

        {/* Spec-sheet panel */}
        <div className="lg:col-span-7 lg:pl-8">
          <div className="rounded-xl border border-forest/15 bg-paper p-6 text-ink shadow-[0_24px_60px_-24px_rgba(10,20,14,0.55)] sm:p-8 dark:border-cream/10 dark:bg-[#20261f] dark:text-cream">
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-forest/15 pb-4 dark:border-cream/12">
              <div>
                <h3 className="font-display text-3xl leading-none tracking-tight">
                  {tomatoes?.name ?? "Tomatoes"}
                </h3>
                <p className="ax-data mt-1.5 text-[11px] text-muted-foreground">
                  {tomatoes?.code ?? "AKM-20491"} · {tomatoes?.supplier.town ?? "Akomadan"} ·{" "}
                  {tomatoes?.supplier.region ?? "Ashanti"}
                </p>
              </div>
              <p className="ax-data text-lg">
                {formatCedis(price)}
                <span className="text-xs text-muted-foreground"> /KG</span>
              </p>
            </div>

            <div className="pt-6">
              <SupplyMeter total={total} available={available} selected={clamped} size="lg" />
            </div>

            {/* Quantity stepper */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <div className="flex items-center rounded-lg border border-forest/25 dark:border-cream/25">
                <button
                  type="button"
                  onClick={() => adjust(-50)}
                  aria-label="Decrease request quantity by 50 kg"
                  className="flex h-11 w-11 cursor-pointer items-center justify-center text-forest transition-colors hover:bg-forest/5 dark:text-cream dark:hover:bg-cream/10"
                >
                  <Minus className="h-4 w-4" strokeWidth={1.75} />
                </button>
                <span className="ax-data w-28 text-center text-lg font-medium">{clamped} KG</span>
                <button
                  type="button"
                  onClick={() => adjust(50)}
                  aria-label="Increase request quantity by 50 kg"
                  className="flex h-11 w-11 cursor-pointer items-center justify-center text-forest transition-colors hover:bg-forest/5 dark:text-cream dark:hover:bg-cream/10"
                >
                  <Plus className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Quick quantities">
                {STEPS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setQty(s)}
                    aria-pressed={clamped === s}
                    className={cn(
                      "ax-data cursor-pointer rounded-lg border px-3 py-2 text-xs transition-colors",
                      clamped === s
                        ? "border-forest bg-forest text-cream dark:border-gold dark:bg-gold dark:text-ink"
                        : "border-forest/25 text-muted-foreground hover:border-forest/60 hover:text-forest dark:border-cream/25 dark:hover:border-cream/60 dark:hover:text-cream",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <p className="ax-data ml-auto text-sm">
                <span className="text-muted-foreground">EST. VALUE </span>
                <span className="text-base font-medium text-terracotta-deep dark:text-gold">
                  {formatCedis(value)}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
