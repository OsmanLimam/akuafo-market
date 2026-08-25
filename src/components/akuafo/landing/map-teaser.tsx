"use client";

import { useAkuafo } from "../store";
import { useSupplies } from "./hero";
import { GhanaMap } from "../map/ghana-map";
import { ArrowLink, Eyebrow } from "../ui";

const ACCRA = { lat: 5.6, lon: -0.19, label: "Accra" };

export function MapTeaser() {
  const openMarket = useAkuafo((s) => s.openMarket);
  const openSupply = useAkuafo((s) => s.openSupply);
  const { data } = useSupplies();
  const supplies = data ?? [];

  const routes = supplies
    .filter((s) => s.code === "AKM-20491")
    .map((s) => ({
      from: { lat: s.supplier.lat, lon: s.supplier.lon, label: s.supplier.town },
      to: ACCRA,
      label: "AKOMADAN → ACCRA",
    }));

  return (
    <section className="bg-background" aria-labelledby="map-heading">
      <div className="mx-auto grid max-w-[1440px] gap-12 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-12 lg:gap-10 lg:px-10 lg:py-32">
        <div className="lg:col-span-4">
          <Eyebrow>Supply map</Eyebrow>
          <h2
            id="map-heading"
            className="mt-4 font-display text-4xl leading-[1.02] tracking-tight text-ink dark:text-cream sm:text-5xl"
          >
            Where your produce <span className="italic">comes from.</span>
          </h2>
          <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
            Every lot is mapped to its source district. See supplier locations across all sixteen
            regions, live availability, and delivery routes to your destination.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            {supplies.slice(0, 3).map((s) => (
              <div
                key={s.id}
                className="flex items-baseline justify-between border-b border-border pb-3"
              >
                <span className="ax-label text-[10px] text-foreground">
                  {s.supplier.town} · {s.supplier.region}
                </span>
                <span className="ax-data text-xs text-muted-foreground">
                  {s.name} · {s.quantityKg.toLocaleString()} KG
                </span>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <ArrowLink onClick={() => openMarket(undefined, "map")}>
              Explore the supply map
            </ArrowLink>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="rounded-xl border border-border bg-card p-4 sm:p-8">
            <GhanaMap supplies={supplies} routes={routes} onSelectSupply={(s) => openSupply(s.id)} />
          </div>
        </div>
      </div>
    </section>
  );
}
