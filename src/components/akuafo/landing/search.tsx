"use client";

import { useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { useAkuafo } from "../store";
import { Eyebrow } from "../ui";
import { GHANA_REGIONS } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "VEGETABLE", label: "Vegetables" },
  { value: "GRAIN", label: "Grains" },
  { value: "TUBER", label: "Tubers & Roots" },
  { value: "FRUIT", label: "Fruits" },
  { value: "LEGUME", label: "Legumes" },
];

const QUICK = ["Tomatoes", "Maize", "Cassava", "Pepper", "Plantain", "Yam", "Pineapple"];

const selectTriggerCls =
  "ax-label h-11 cursor-pointer rounded-lg border-forest/30 bg-transparent text-[11px] text-foreground hover:border-forest/60 dark:border-cream/30 dark:hover:border-cream/60";

export function SearchSection() {
  const openMarket = useAkuafo((s) => s.openMarket);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [region, setRegion] = useState("");
  const [minQty, setMinQty] = useState("");
  const [delivery, setDelivery] = useState("");

  const submit = () => {
    openMarket({
      q,
      category,
      region,
      minQty: minQty ? Number(minQty.replace(/\D/g, "")) : null,
      deliveryOnly: delivery === "DELIVERY",
    });
  };

  return (
    <section className="border-b border-border bg-background" aria-labelledby="sourcing-heading">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-12 lg:gap-8 lg:px-10 lg:py-32">
        <div className="lg:col-span-4">
          <Eyebrow>Search</Eyebrow>
          <h2
            id="sourcing-heading"
            className="mt-4 font-display text-4xl leading-[1.02] tracking-tight text-ink dark:text-cream sm:text-5xl"
          >
            What are you
            <br />
            <span className="italic">sourcing?</span>
          </h2>
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Search live lots from verified farms, cooperatives and aggregators. Filter by
            commodity, location, quantity and fulfilment.
          </p>
        </div>

        <div className="lg:col-span-8 lg:pt-2">
          {/* Primary search, editorial serif italic */}
          <div className="group flex items-center gap-4 border-b-2 border-forest pb-3 transition-colors focus-within:border-terracotta dark:border-cream dark:focus-within:border-gold">
            <Search className="h-6 w-6 shrink-0 text-forest dark:text-cream" strokeWidth={1.5} aria-hidden />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Search tomatoes, maize, cassava, pepper…"
              aria-label="Search commodities"
              className="w-full bg-transparent font-display text-2xl italic tracking-tight text-ink placeholder:text-ink/35 focus:outline-none dark:text-cream dark:placeholder:text-cream/30 sm:text-3xl"
            />
          </div>

          {/* Filters */}
          <div className="mt-6 flex flex-wrap items-stretch gap-3">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className={cn("w-[160px]", selectTriggerCls)} aria-label="Commodity">
                <SelectValue placeholder="Commodity" />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value} className="rounded-md">
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger className={cn("w-[170px]", selectTriggerCls)} aria-label="Location">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                {GHANA_REGIONS.map((r) => (
                  <SelectItem key={r} value={r} className="rounded-md">
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex h-11 items-center rounded-lg border border-forest/30 dark:border-cream/30">
              <input
                type="text"
                inputMode="numeric"
                value={minQty}
                onChange={(e) => setMinQty(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="Min KG"
                aria-label="Minimum quantity in kilograms"
                className="ax-data h-full w-24 bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>

            <Select value={delivery} onValueChange={setDelivery}>
              <SelectTrigger className={cn("w-[190px]", selectTriggerCls)} aria-label="Availability">
                <SelectValue placeholder="Availability" />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                <SelectItem value="DELIVERY" className="rounded-md">
                  Delivery available
                </SelectItem>
                <SelectItem value="ANY" className="rounded-md">
                  Any fulfilment
                </SelectItem>
              </SelectContent>
            </Select>

            <button
              type="button"
              onClick={submit}
              className="ax-label group ml-auto inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg bg-forest px-6 text-[11px] text-cream transition-all hover:bg-forest-mid active:scale-[0.98] dark:bg-gold dark:text-ink dark:hover:bg-gold/85"
            >
              Search produce
              <ArrowRight
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                strokeWidth={1.75}
                aria-hidden
              />
            </button>
          </div>

          {/* Quick commodity links */}
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="ax-label text-muted-foreground">Popular</span>
            {QUICK.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => openMarket({ q: c })}
                className="ax-data cursor-pointer text-[13px] text-forest underline-offset-4 transition-colors hover:text-terracotta-deep hover:underline dark:text-cream dark:hover:text-gold"
              >
                {c.toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
