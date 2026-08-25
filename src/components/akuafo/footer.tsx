"use client";

import { useAkuafo } from "./store";
import { Logo } from "./logo";

const COMMODITY_INDEX = [
  { label: "Vegetables", value: "VEGETABLE" },
  { label: "Grains", value: "GRAIN" },
  { label: "Tubers & Roots", value: "TUBER" },
  { label: "Fruits", value: "FRUIT" },
  { label: "Legumes", value: "LEGUME" },
];

export function Footer() {
  const { openMarket, setView, openInfo, goHowItWorks } = useFooterNav();

  return (
    <footer className="mt-auto bg-forest-deep text-cream">
      <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-10 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="flex flex-col gap-6 lg:col-span-5">
            <Logo light />
            <p className="font-display text-3xl leading-tight tracking-tight text-cream/90 sm:text-4xl">
              Source produce
              <br />
              <span className="italic text-gold">with confidence.</span>
            </p>
            <p className="max-w-sm text-sm leading-relaxed text-cream/60">
              A B2B marketplace for sourcing agricultural produce directly from suppliers across
              Ghana, with visibility from farm to buyer.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-7 lg:pt-4">
            <nav aria-label="Marketplace">
              <p className="ax-label mb-4 text-cream/50">Marketplace</p>
              <ul className="flex flex-col gap-3">
                {COMMODITY_INDEX.map((c) => (
                  <li key={c.value}>
                    <button
                      type="button"
                      onClick={() => openMarket({ category: c.value })}
                      className="cursor-pointer text-sm text-cream/80 transition-colors hover:text-gold"
                    >
                      {c.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label="Platform">
              <p className="ax-label mb-4 text-cream/50">Platform</p>
              <ul className="flex flex-col gap-3">
                <li>
                  <button
                    type="button"
                    onClick={goHowItWorks}
                    className="cursor-pointer text-sm text-cream/80 transition-colors hover:text-gold"
                  >
                    How it works
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setView("buyer")}
                    className="cursor-pointer text-sm text-cream/80 transition-colors hover:text-gold"
                  >
                    For buyers
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setView("supplier")}
                    className="cursor-pointer text-sm text-cream/80 transition-colors hover:text-gold"
                  >
                    For suppliers
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openMarket(undefined, "map")}
                    className="cursor-pointer text-sm text-cream/80 transition-colors hover:text-gold"
                  >
                    Supply map
                  </button>
                </li>
              </ul>
            </nav>

            <div>
              <p className="ax-label mb-4 text-cream/50">Contact</p>
              <address className="flex flex-col gap-3 text-sm not-italic leading-relaxed text-cream/80">
                <span>
                  Osman Limam
                  <br />
                  KNUST, Kumasi, Ghana
                </span>
                <a
                  href="mailto:osmanlimam083@gmail.com"
                  className="ax-data w-fit text-[13px] transition-colors hover:text-gold"
                >
                  osmanlimam083@gmail.com
                </a>
                <a
                  href="tel:+233536828150"
                  className="ax-data w-fit text-[13px] transition-colors hover:text-gold"
                >
                  +233 53 682 8150
                </a>
              </address>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-cream/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="ax-data text-[11px] text-cream/45">
            © {new Date().getFullYear()} Akuafo Market · Built by Osman Limam
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <button
              type="button"
              onClick={() => openInfo("about")}
              className="ax-data cursor-pointer text-[11px] text-cream/45 transition-colors hover:text-gold"
            >
              About
            </button>
            <button
              type="button"
              onClick={() => openInfo("terms")}
              className="ax-data cursor-pointer text-[11px] text-cream/45 transition-colors hover:text-gold"
            >
              Terms
            </button>
            <button
              type="button"
              onClick={() => openInfo("privacy")}
              className="ax-data cursor-pointer text-[11px] text-cream/45 transition-colors hover:text-gold"
            >
              Privacy
            </button>
            <span className="ax-data text-[11px] text-cream/45">Ghana · English</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* Small helper hook to keep the footer tidy */
function useFooterNav() {
  const openMarket = useAkuafo((s) => s.openMarket);
  const setView = useAkuafo((s) => s.setView);
  const openInfo = useAkuafo((s) => s.openInfo);

  const goHowItWorks = () => {
    setView("landing");
    setTimeout(() => {
      document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 180);
  };

  return { openMarket, setView, openInfo, goHowItWorks };
}
