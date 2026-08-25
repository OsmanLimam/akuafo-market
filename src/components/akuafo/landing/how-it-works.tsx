"use client";

import {
  Banknote,
  CheckCircle2,
  ClipboardList,
  Inbox,
  PackageCheck,
  PackagePlus,
  Route,
  Search,
} from "lucide-react";
import { useAkuafo } from "../store";
import { CtaPrimary, Eyebrow } from "../ui";
import { cn } from "@/lib/utils";

const BUYER_STEPS = [
  {
    n: "01",
    icon: Search,
    name: "Search",
    desc: "Browse live supply by commodity, region, quantity and price.",
  },
  {
    n: "02",
    icon: ClipboardList,
    name: "Request",
    desc: "Choose your quantity and delivery. Suppliers confirm in hours, not days.",
  },
  {
    n: "03",
    icon: Route,
    name: "Track",
    desc: "Follow your order from harvest to your destination.",
  },
  {
    n: "04",
    icon: PackageCheck,
    name: "Receive",
    desc: "Receipt your delivery and keep the record.",
  },
];

const SUPPLIER_STEPS = [
  {
    n: "01",
    icon: PackagePlus,
    name: "Create your listing",
    desc: "Publish available quantities, grades and prices.",
  },
  {
    n: "02",
    icon: Inbox,
    name: "Receive requests",
    desc: "Businesses request directly from your lot.",
  },
  {
    n: "03",
    icon: CheckCircle2,
    name: "Confirm fulfilment",
    desc: "Accept, grade, and pack to the buyer's specification.",
  },
  {
    n: "04",
    icon: Banknote,
    name: "Get paid",
    desc: "Complete the order and build your track record.",
  },
];

const SUPPLIER_CHAIN = [
  "Create account",
  "Build profile",
  "List produce",
  "Receive requests",
  "Confirm fulfilment",
  "Complete order",
];

function StepStrip({ label, steps }: { label: string; steps: typeof BUYER_STEPS }) {
  return (
    <div className="flex flex-col">
      <p className="ax-label text-terracotta-deep dark:text-terracotta">{label}</p>
      <ol className="mt-6 flex flex-col">
        {steps.map((s, i) => (
          <li
            key={s.n}
            className={cn("flex items-start gap-5 py-6", i > 0 && "border-t border-border")}
          >
            <span className="ax-data w-7 shrink-0 pt-1 text-xs text-muted-foreground">{s.n}</span>
            <s.icon
              className="mt-1 h-5 w-5 shrink-0 text-forest dark:text-olive-light"
              strokeWidth={1.5}
              aria-hidden
            />
            <div className="flex flex-col gap-1.5">
              <h3 className="font-display text-2xl leading-none tracking-tight text-ink dark:text-cream">
                {s.name}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function HowItWorks() {
  const setView = useAkuafo((s) => s.setView);

  return (
    <section
      id="how-it-works"
      className="scroll-mt-16 border-b border-border bg-background"
      aria-labelledby="how-heading"
    >
      <div className="mx-auto max-w-[1440px] px-4 py-20 sm:px-6 sm:py-24 lg:px-10 lg:py-32">
        <div className="flex flex-col gap-4">
          <Eyebrow>How it works</Eyebrow>
          <h2
            id="how-heading"
            className="font-display text-4xl leading-[1.04] tracking-tight text-ink dark:text-cream sm:text-5xl lg:text-6xl"
          >
            From search to delivery,
            <br />
            <span className="italic">in four steps.</span>
          </h2>
        </div>

        <div className="mt-14 grid gap-14 xl:grid-cols-2 xl:gap-0">
          <div className="xl:pr-14">
            <StepStrip label="For buyers" steps={BUYER_STEPS} />
          </div>
          <div className="xl:border-l xl:border-border xl:pl-14">
            <StepStrip label="For suppliers" steps={SUPPLIER_STEPS} />
          </div>
        </div>
      </div>

      {/* Supplier CTA band, full bleed */}
      <div className="rounded-none bg-ink text-cream">
        <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-10 lg:py-20">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <h3 className="font-display text-4xl leading-[1.05] tracking-tight text-cream sm:text-5xl">
                Sell where the market <span className="italic text-gold">is looking.</span>
              </h3>
              <p className="mt-5 text-[15px] leading-relaxed text-cream/70">
                List your produce once. Wholesalers, processors and institutional buyers find you.
              </p>
            </div>
            <CtaPrimary
              onClick={() => setView("signup")}
              className="shrink-0 bg-cream text-ink hover:bg-gold dark:bg-cream dark:text-ink dark:hover:bg-gold"
            >
              Start selling
            </CtaPrimary>
          </div>

          {/* The six-step supplier journey, as a compact chain */}
          <div className="mt-14 border-t border-cream/15 pt-8">
            <p className="ax-label text-cream/50">The supplier journey</p>
            <ol className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3">
              {SUPPLIER_CHAIN.map((step, i) => (
                <li key={step} className="flex items-center gap-4">
                  <span className="flex items-center gap-2.5">
                    <span className="ax-data text-[11px] text-gold">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="ax-label text-[10px] text-cream/80">{step}</span>
                  </span>
                  {i < SUPPLIER_CHAIN.length - 1 && (
                    <span className="hidden h-px w-8 bg-cream/25 sm:block" aria-hidden />
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
