/**
 * Operator-configurable brand values used by the API.
 *
 * Currently only the vCard ORG field. Keep this in sync with the values used
 * in the web app (apps/web/src/lib/brand.ts) for a consistent visitor experience.
 *
 * Per-region overrides:
 *   COMPANY_NAME_IN / COMPANY_NAME_US — used when an employee's `country` field
 *   is set to "IN" or "US". Falls back to COMPANY_NAME when unset.
 */
const DEFAULT_NAME = process.env.COMPANY_NAME?.trim() || "Your Company";

const REGIONAL_NAMES: Record<"IN" | "US", string> = {
  IN: process.env.COMPANY_NAME_IN?.trim() || DEFAULT_NAME,
  US: process.env.COMPANY_NAME_US?.trim() || DEFAULT_NAME,
};

export const brand = {
  name: DEFAULT_NAME,
} as const;

export function brandNameFor(country: string | null | undefined): string {
  const key = country?.toUpperCase();
  if (key === "IN" || key === "US") return REGIONAL_NAMES[key];
  return DEFAULT_NAME;
}
