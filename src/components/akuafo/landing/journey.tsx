"use client";

import Image from "next/image";
import { ArrowRight, Building2, Package, Sprout, Truck, Wheat } from "lucide-react";
import { useAkuafo } from "../store";
import { Eyebrow } from "../ui";

const STEPS = [
  {
    n: "01",
    icon: Sprout,
    name: "Farm",
    desc: "Produce is listed from the source farm, cooperative or aggregator, with location and lot size.",
  },
  {
    n: "02",
    icon: Wheat,
    name: "Harvested",
    desc: "Lots are cut, graded and weighed in the field within the stated harvest window.",
  },
  {
    n: "03",
    icon: Package,
    name: "Packed",
    desc: "Crated and labelled with a traceable lot code that travels with the order.",
  },
  {
    n: "04",
    icon: Truck,
    name: "In transit",
    desc: "Dispatched with route visibility from the farm gate to your destination.",
  },
  {
    n: "05",
    icon: Building2,
    name: "Buyer",
    desc: "Receipted at your depot, restaurant or facility, and the record closes.",
  },
];

export function Journey() {
  const openOrder = useAkuafo((s) => s.openOrder);

  return (
    <section id="farm-to-buyer" className="scroll-mt-16 bg-ink text-cream" aria-labelledby="journey-heading">
      <div className="mx-auto max-w-[1440px] px-4 py-20 sm:px-6 sm:py-24 lg:px-10 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <Eyebrow className="text-gold dark:text-gold">Farm-to-buyer journey</Eyebrow>
            <h2
              id="journey-heading"
              className="mt-4 font-display text-4xl leading-[1.02] tracking-tight text-cream sm:text-5xl lg:text-6xl"
            >
              Every kilo,
              <br />
              <span className="italic text-gold">accounted for.</span>
            </h2>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-cream/70">
              A sourcing request on Akuafo Market follows a documented journey. Each step is
              timestamped against your order, so you always know where your produce stands.
            </p>
            <div className="relative mt-10 aspect-[4/3] overflow-hidden rounded-xl border border-cream/15">
              <Image
                src="/images/logistics.png"
                alt="A loaded produce truck with wooden crates of vegetables at a Ghanaian farm collection point at dawn"
                fill
                sizes="(min-width: 1024px) 38vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>

          <div className="lg:col-span-7 lg:pl-6">
            {/* Desktop: horizontal rail; mobile: vertical */}
            <ol className="grid grid-cols-1 gap-0 sm:grid-cols-5 sm:gap-0">
              {STEPS.map((s, i) => (
                <li
                  key={s.n}
                  className="relative border-l border-cream/15 pb-10 pl-6 pr-4 pt-1 sm:border-l-0 sm:border-t sm:pb-0 sm:pl-0 sm:pt-8"
                >
                  {/* rail node */}
                  <span
                    className="absolute left-[-5px] top-[7px] h-2.5 w-2.5 rotate-45 bg-terracotta sm:left-0 sm:top-[-5px]"
                    aria-hidden
                  />
                  {i === STEPS.length - 1 && (
                    <span
                      className="absolute left-[-5px] top-[7px] h-2.5 w-2.5 rotate-45 bg-gold ring-4 ring-gold/25 sm:left-0 sm:top-[-5px]"
                      aria-hidden
                    />
                  )}
                  <span className="ax-data text-xs text-cream/45">{s.n}</span>
                  <div className="mt-3 flex items-center gap-3">
                    <s.icon className="h-5 w-5 text-gold" strokeWidth={1.5} aria-hidden />
                    <h3 className="ax-label text-cream">{s.name}</h3>
                  </div>
                  <p className="mt-3 max-w-56 text-xs leading-relaxed text-cream/60">{s.desc}</p>
                </li>
              ))}
            </ol>

            <div className="mt-10 rounded-xl border border-cream/15 bg-cream/[0.03] p-6 sm:mt-14">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="ax-label text-cream/55">Live example</p>
                  <p className="ax-data mt-2 text-sm text-cream/85">
                    AKM-ORD-1088 · WHITE MAIZE 5,000 KG · IN TRANSIT
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openOrder("AKM-ORD-1088")}
                  className="ax-label group inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-cream/40 px-5 text-cream transition-all hover:border-cream hover:bg-cream/10 active:scale-[0.98]"
                >
                  Track this order
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
