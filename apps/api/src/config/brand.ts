/**
 * Operator-configurable brand values used by the API.
 *
 * Currently only the vCard ORG field. Keep this in sync with the values used
 * in the web app (apps/web/src/lib/brand.ts) for a consistent visitor experience.
 */
export const brand = {
  name: process.env.COMPANY_NAME?.trim() || "Your Company",
} as const;
