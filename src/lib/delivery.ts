/* ── Delivery destinations & fees ──────────────────────────────────────────
   Single source of truth for delivery destinations and their reference fees.
   The client imports this for display only; the SERVER decides the actual
   fee charged on every order (the client-sent fee is ignored).            */

export const DESTINATIONS: { name: string; fee: number }[] = [
  { name: "Odorna, Accra", fee: 380 },
  { name: "Kasoa, Central Region", fee: 420 },
  { name: "Tema Community 25", fee: 450 },
  { name: "Adum, Kumasi", fee: 350 },
  { name: "Ho Industrial Area", fee: 750 },
];

/** Flat reference fee for buyer-entered destinations outside the preset list. */
export const CUSTOM_DESTINATION_FEE = 420;

/** Server-authoritative fee lookup (case/whitespace tolerant). */
export function deliveryFeeFor(destination: string): number {
  const needle = destination.trim().toLowerCase();
  const hit = DESTINATIONS.find((d) => d.name.toLowerCase() === needle);
  return hit ? hit.fee : CUSTOM_DESTINATION_FEE;
}
