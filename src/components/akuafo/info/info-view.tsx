"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useAkuafo, type InfoPage } from "../store";
import { AkuafoMark } from "../logo";
import { Eyebrow } from "../ui";

const PAGE_ORDER: InfoPage[] = ["about", "terms", "privacy"];

const PAGE_LABEL: Record<InfoPage, string> = {
  about: "About",
  terms: "Terms",
  privacy: "Privacy",
};

const CONTACT_EMAIL = "osmanlimam083@gmail.com";
const CONTACT_PHONE = "+233 53 682 8150";

/* ── Hand-rolled prose helpers (no typography plugin) ─────────────────── */

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-8 space-y-4 text-[15px] leading-relaxed text-muted-foreground">
      {children}
    </div>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="flex items-baseline gap-3 font-display text-2xl tracking-tight text-ink dark:text-cream">
        <span className="ax-data text-xs text-terracotta-deep dark:text-terracotta">{n}</span>
        {title}
      </h2>
      <div className="mt-3 space-y-4 text-[15px] leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

/* ── Pages ────────────────────────────────────────────────────────────── */

function AboutBody() {
  return (
    <>
      <div className="flex flex-col items-center gap-6">
        <AkuafoMark className="h-14 w-14 text-forest dark:text-cream" />
        <Eyebrow className="justify-center">About</Eyebrow>
        <h1 className="text-center font-display text-4xl leading-[1.05] tracking-tight text-ink dark:text-cream sm:text-5xl">
          Akuafo Market.
        </h1>
      </div>
      <Prose>
        <p>
          Akuafo Market is a B2B agricultural marketplace connecting producers across Ghana with
          the businesses that source from them: wholesalers, retailers, restaurants, processors
          and institutional buyers.
        </p>
        <p>
          It is a working prototype designed and built by Osman Limam at KNUST, Kumasi, as a
          demonstration of digital infrastructure for agricultural commerce.
        </p>
        <div className="mt-6 border-t border-border pt-5">
          <p className="ax-label text-muted-foreground">Contact</p>
          <p className="mt-3">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="ax-data text-[13px] text-forest underline-offset-4 transition-colors hover:underline dark:text-cream"
            >
              {CONTACT_EMAIL}
            </a>
            <span className="mx-2 text-border" aria-hidden>
              ·
            </span>
            <a
              href="tel:+233536828150"
              className="ax-data text-[13px] text-forest underline-offset-4 transition-colors hover:underline dark:text-cream"
            >
              {CONTACT_PHONE}
            </a>
          </p>
        </div>
      </Prose>
    </>
  );
}

function TermsBody() {
  return (
    <>
      <Eyebrow>Terms</Eyebrow>
      <h1 className="mt-4 font-display text-4xl leading-[1.05] tracking-tight text-ink dark:text-cream sm:text-5xl">
        Terms of use.
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
        These terms cover the basics of using Akuafo Market. It is a prototype, so keep them short
        and honest.
      </p>

      <Section n="01" title="Accounts">
        <p>
          You are responsible for the accuracy of your account details and for activity carried
          out under your login. Keep your password to yourself.
        </p>
      </Section>
      <Section n="02" title="Listings">
        <p>
          Suppliers are responsible for the accuracy of their listings: quantities, grades,
          prices, harvest windows and photographs.
        </p>
      </Section>
      <Section n="03" title="Requests are not orders">
        <p>
          A request on Akuafo Market is a non-binding purchase request. It becomes a transaction
          only when you and the supplier agree the terms directly.
        </p>
      </Section>
      <Section n="04" title="Fulfilment">
        <p>
          Delivery, quality acceptance and payment are arranged between buyer and supplier.
          Akuafo Market records the journey but does not process payments.
        </p>
      </Section>
      <Section n="05" title="Prototype">
        <p>
          This is a working prototype. Data may be reset and features may change without notice.
        </p>
      </Section>
      <Section n="06" title="Contact">
        <p>
          Questions about these terms:{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="ax-data text-[13px] text-forest underline-offset-4 transition-colors hover:underline dark:text-cream"
          >
            {CONTACT_EMAIL}
          </a>
        </p>
      </Section>
    </>
  );
}

function PrivacyBody() {
  return (
    <>
      <Eyebrow>Privacy</Eyebrow>
      <h1 className="mt-4 font-display text-4xl leading-[1.05] tracking-tight text-ink dark:text-cream sm:text-5xl">
        Privacy.
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
        A short account of what this prototype stores and what it doesn&rsquo;t do with it.
      </p>

      <Section n="01" title="What is stored">
        <p>
          Your account details (name, email, business information), the listings suppliers
          publish, and the orders placed between buyers and suppliers with their event history.
        </p>
      </Section>
      <Section n="02" title="What is not done with it">
        <p>
          Your data is not sold and not shared with third parties. It exists to run the
          marketplace.
        </p>
      </Section>
      <Section n="03" title="Your browser">
        <p>
          Saved produce, saved suppliers, sign-in state and notification preferences are kept in
          your browser&rsquo;s local storage. Clearing your browser data removes them.
        </p>
      </Section>
      <Section n="04" title="Contact">
        <p>
          Questions about privacy:{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="ax-data text-[13px] text-forest underline-offset-4 transition-colors hover:underline dark:text-cream"
          >
            {CONTACT_EMAIL}
          </a>
        </p>
      </Section>
    </>
  );
}

/* ── View ─────────────────────────────────────────────────────────────── */

export function InfoView() {
  const infoPage = useAkuafo((s) => s.infoPage);
  const openInfo = useAkuafo((s) => s.openInfo);

  const idx = PAGE_ORDER.indexOf(infoPage);
  const prev = PAGE_ORDER[(idx - 1 + PAGE_ORDER.length) % PAGE_ORDER.length];
  const next = PAGE_ORDER[(idx + 1) % PAGE_ORDER.length];

  return (
    <main id="main" className="pt-28">
      <div className="mx-auto max-w-3xl px-4 pb-24 sm:px-6">
        {infoPage === "about" && <AboutBody />}
        {infoPage === "terms" && <TermsBody />}
        {infoPage === "privacy" && <PrivacyBody />}

        {/* Prev / next */}
        <nav
          className="mt-16 flex items-center justify-between border-t border-border pt-6"
          aria-label="Information pages"
        >
          <button
            type="button"
            onClick={() => openInfo(prev)}
            className="ax-label group inline-flex cursor-pointer items-center gap-2 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft
              className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-1"
              strokeWidth={1.75}
              aria-hidden
            />
            {PAGE_LABEL[prev]}
          </button>
          <button
            type="button"
            onClick={() => openInfo(next)}
            className="ax-label group inline-flex cursor-pointer items-center gap-2 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
          >
            {PAGE_LABEL[next]}
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1"
              strokeWidth={1.75}
              aria-hidden
            />
          </button>
        </nav>
      </div>
    </main>
  );
}
