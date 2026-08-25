import { format } from "date-fns";

/* Time-aware greeting prefix shared by the buyer & supplier dashboards.
   Views render client-side after navigation, so reading the clock during
   render is safe (no SSR hydration mismatch for these views). */
export function greetingPrefix(): string {
  const h = new Date().getHours();
  if (h < 12) return "GOOD MORNING";
  if (h < 17) return "GOOD AFTERNOON";
  return "GOOD EVENING";
}

export function todayLabel(): string {
  return format(new Date(), "d MMM yyyy");
}
