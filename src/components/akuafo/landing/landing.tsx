"use client";

import { Hero } from "./hero";
import { SearchSection } from "./search";
import { AvailableNow } from "./available-now";
import { SupplyViz } from "./supply-viz";
import { Journey } from "./journey";
import { HowItWorks } from "./how-it-works";
import { MapTeaser } from "./map-teaser";

export function Landing() {
  return (
    <main id="main">
      <Hero />
      <SearchSection />
      <AvailableNow />
      <SupplyViz />
      <Journey />
      <HowItWorks />
      <MapTeaser />
    </main>
  );
}
