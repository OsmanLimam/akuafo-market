/* ── Ghana phone numbers & WhatsApp links ──────────────────────────────────
   Accepts the common local formats and normalises to international digits:
     020 123 4567   -> 233201234567
     +233201234567  -> 233201234567
     00233201234567 -> 233201234567
   Returns the bare digits (no "+") — exactly what wa.me expects — or null
   when the input can't be a plausible Ghana mobile number.                */

export function normalizeGhanaPhone(input: string): string | null {
  let d = input.replace(/\D/g, "");
  if (!d) return null;
  if (d.startsWith("00233")) d = d.slice(5);
  if (d.startsWith("233")) d = d.slice(3);
  if (d.startsWith("0")) d = d.slice(1);
  // After stripping the prefix a Ghana mobile is 9 digits (e.g. 201234567).
  if (d.length !== 9) return null;
  return `233${d}`;
}

/** Pretty display form: 233201234567 -> "+233 20 123 4567" */
export function formatGhanaPhone(digits: string): string {
  if (!digits) return "";
  if (digits.startsWith("233") && digits.length === 12) {
    const rest = digits.slice(3); // 9 local digits, e.g. 201234567
    return `+233 ${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5)}`;
  }
  return `+${digits}`;
}

/** Click-to-chat link; returns null when we have no usable number. */
export function whatsappLink(phoneDigits: string, message: string): string | null {
  if (!phoneDigits) return null;
  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
}
