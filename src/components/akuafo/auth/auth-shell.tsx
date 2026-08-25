"use client";

import Image from "next/image";
import { Logo } from "../logo";

/**
 * Shared split layout for all auth screens:
 * left = full-bleed photograph over ink with brand + quote (lg+),
 * right = the form column. On mobile only the form renders, with a
 * compact brand header row.
 */
export function AuthShell({
  image,
  imageAlt,
  quote,
  children,
}: {
  image: string;
  imageAlt: string;
  quote: { line: string; italic: string };
  children: React.ReactNode;
}) {
  return (
    <main id="main" className="flex min-h-screen flex-col pt-16 lg:flex-row">
      {/* Left panel, photograph + quote */}
      <aside className="relative hidden shrink-0 overflow-hidden bg-ink lg:flex lg:w-[45%] lg:flex-col lg:justify-between lg:p-10">
        <Image
          src={image}
          alt={imageAlt}
          fill
          priority
          sizes="45vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-ink/60" aria-hidden />
        <div className="relative z-10">
          <Logo light />
        </div>
        <blockquote className="relative z-10 max-w-md font-display text-3xl leading-tight tracking-tight text-cream">
          {quote.line}
          <br />
          <span className="italic text-gold">{quote.italic}</span>
        </blockquote>
      </aside>

      {/* Right panel, form */}
      <section className="flex flex-1 flex-col">
        {/* Mobile brand header */}
        <div className="flex items-center justify-between px-6 pt-6 lg:hidden">
          <Logo />
        </div>
        <div className="flex flex-1 items-center justify-center px-6 py-12 sm:py-16 lg:py-0">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </section>
    </main>
  );
}
