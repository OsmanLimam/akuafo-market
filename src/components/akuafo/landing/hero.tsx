"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAkuafo } from "../store";
import type { Supply } from "@/lib/types";
import { formatCedis } from "@/lib/types";

const FALLBACK_TICKER = [
  { name: "Tomatoes", pricePerKg: 8.4 },
  { name: "White Maize", pricePerKg: 3.2 },
  { name: "Cassava", pricePerKg: 2.1 },
  { name: "Scotch Bonnet Pepper", pricePerKg: 14.2 },
  { name: "Plantain", pricePerKg: 5.6 },
  { name: "Puna Yam", pricePerKg: 4.5 },
  { name: "Smooth Cayenne Pineapple", pricePerKg: 6.2 },
  { name: "Red Onions", pricePerKg: 11.5 },
];

async function fetchSupplies(): Promise<Supply[]> {
  const res = await fetch("/api/supplies");
  if (!res.ok) throw new Error("Failed to load supplies");
  const data = await res.json();
  return data.supplies as Supply[];
}

export function useSupplies() {
  return useQuery({ queryKey: ["supplies", "all"], queryFn: fetchSupplies });
}

export function Hero() {
  const openMarket = useAkuafo((s) => s.openMarket);
  const setView = useAkuafo((s) => s.setView);
  const { data } = useSupplies();
  const reduced = useReducedMotion();

  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "14%"]);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.06, 1]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -56]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0.25]);

  const ticker = (data?.length ? data : FALLBACK_TICKER).slice(0, 10);
  const tickerItems = ticker.map((s) => ({
    name: s.name,
    price: formatCedis(s.pricePerKg),
  }));

  return (
    <section ref={ref} className="relative h-[92svh] min-h-[560px] overflow-hidden bg-ink">
      {/* Photograph with parallax */}
      <motion.div
        className="absolute inset-0"
        style={reduced ? undefined : { y: imgY, scale: imgScale }}
        aria-hidden
      >
        <Image
          src="/images/hero.png"
          alt="Farmers harvesting tomatoes into wooden crates on a farm in the Ashanti region of Ghana at golden hour"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </motion.div>
      {/* Legibility scrims, bottom lift + left shade so the headline always reads */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/40 to-ink/45"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-ink/55 via-transparent to-transparent"
        aria-hidden
      />

      {/* Content */}
      <motion.div
        style={reduced ? undefined : { y: textY, opacity: textOpacity }}
        className="relative z-10 mx-auto flex h-full max-w-[1440px] flex-col justify-end px-4 pb-36 sm:px-6 sm:pb-32 lg:px-10"
      >
        <div className="ax-rise">
          <p className="ax-label flex items-center gap-3 text-cream/75">
            <span className="inline-block h-1.5 w-1.5 bg-terracotta" aria-hidden />
            B2B Agricultural Sourcing · Ghana
          </p>
          <h1 className="mt-5 font-display text-[clamp(2.75rem,8.75vw,8rem)] leading-[0.92] tracking-tight text-cream">
            SOURCE PRODUCE
            <br />
            <span className="italic">WITH CONFIDENCE.</span>
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-cream/80 sm:text-base">
            Find available agricultural produce from suppliers across Ghana.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => openMarket()}
              className="ax-label group inline-flex h-12 cursor-pointer items-center gap-2 rounded-lg bg-cream px-7 text-[11.5px] text-ink transition-all hover:bg-gold active:scale-[0.98]"
            >
              Explore produce
              <ArrowRight
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                strokeWidth={1.75}
                aria-hidden
              />
            </button>
            <button
              type="button"
              onClick={() => setView("signup")}
              className="ax-label inline-flex h-12 cursor-pointer items-center rounded-lg border border-cream/40 px-7 text-[11.5px] text-cream transition-all hover:border-cream hover:bg-cream/10 active:scale-[0.98]"
            >
              Start selling
            </button>
          </div>
        </div>
      </motion.div>

      {/* Commodity ticker */}
      <div className="absolute inset-x-0 bottom-0 z-10 border-t border-cream/15 bg-ink/45 backdrop-blur-sm">
        <div className="ax-marquee flex overflow-hidden py-3" aria-hidden>
          {[0, 1].map((dup) => (
            <div key={dup} className="flex shrink-0 items-center">
              {tickerItems.map((t, i) => (
                <span key={`${dup}-${i}`} className="flex shrink-0 items-center">
                  <span className="ax-label text-[11px] text-cream/85">{t.name}</span>
                  <span className="ax-data ml-2 text-[11px] text-gold">{t.price}</span>
                  <span className="mx-6 inline-block h-1 w-1 rotate-45 bg-terracotta/70" aria-hidden />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
