/**
 * Operator-configurable branding shown on public profile pages.
 *
 * Set these in `apps/web/.env.local` (NEXT_PUBLIC_ vars are exposed to the
 * browser). All fields fall back to neutral defaults so a fresh clone looks
 * presentable without any configuration.
 *
 * Per-region overrides:
 *   Each employee can be tagged with a `country` ("IN" or "US"). When set, the
 *   profile card and vCard pull the company name, address, and map URL from
 *   the corresponding regional env var (NEXT_PUBLIC_BRAND_NAME_IN /
 *   NEXT_PUBLIC_BRAND_NAME_US, etc.). When unset, the defaults below are used.
 *
 * NOTE: the "Powered by Intelligaia" attribution rendered on the landing page
 * is a license requirement (ISAL v1.0 §4) and is intentionally NOT configurable
 * here. To remove it, obtain a commercial license — see COMMERCIAL_USE.md.
 */

interface RegionalBrand {
  /** Display name shown on the profile contact card and as the vCard ORG. */
  name: string;
  /** Multi-line address. Use \n for line breaks. Address block hidden when empty. */
  address: string;
  /** Optional Maps URL for the "Get directions" button. Button hidden when empty. */
  mapUrl: string;
}

export const brand = {
  /** Default (region-agnostic) full legal / display name. */
  name: process.env.NEXT_PUBLIC_BRAND_NAME || "Your Company",
  /** Short brand label used for logo alt text. */
  shortName: process.env.NEXT_PUBLIC_BRAND_SHORT_NAME || "Logo",
  /** Domain shown on the profile contact card (e.g. "example.com"). */
  website: process.env.NEXT_PUBLIC_BRAND_WEBSITE || "example.com",
  /** Optional tagline shown under the logo. Hidden when empty. */
  tagline: process.env.NEXT_PUBLIC_BRAND_TAGLINE || "",
  /** Optional subtitle under the company name on the contact card. */
  subtitle: process.env.NEXT_PUBLIC_BRAND_SUBTITLE || "",
  /** Default (region-agnostic) multi-line address. \n-separated. */
  address: process.env.NEXT_PUBLIC_BRAND_ADDRESS || "",
  /** Default Maps URL for the "Get directions" button. */
  mapUrl: process.env.NEXT_PUBLIC_BRAND_MAP_URL || "",
  /** Path or URL to the light-background (dark-fill) logo. */
  logoLight: process.env.NEXT_PUBLIC_BRAND_LOGO_LIGHT || "/profile/logo.svg",
  /** Path or URL to the dark-background (light-fill) logo. */
  logoDark: process.env.NEXT_PUBLIC_BRAND_LOGO_DARK || "/profile/logo-dark.svg",
} as const;

const REGIONS: Record<"IN" | "US", RegionalBrand> = {
  IN: {
    name: process.env.NEXT_PUBLIC_BRAND_NAME_IN || brand.name,
    address: process.env.NEXT_PUBLIC_BRAND_ADDRESS_IN || brand.address,
    mapUrl: process.env.NEXT_PUBLIC_BRAND_MAP_URL_IN || brand.mapUrl,
  },
  US: {
    name: process.env.NEXT_PUBLIC_BRAND_NAME_US || brand.name,
    address: process.env.NEXT_PUBLIC_BRAND_ADDRESS_US || brand.address,
    mapUrl: process.env.NEXT_PUBLIC_BRAND_MAP_URL_US || brand.mapUrl,
  },
};

/**
 * Resolve the company name, address, and map URL for a given employee's
 * country tag. Falls back to the unscoped defaults when country is null/blank
 * or doesn't match a known region.
 */
export function brandFor(country: string | null | undefined): RegionalBrand {
  const key = country?.toUpperCase();
  if (key === "IN" || key === "US") return REGIONS[key];
  return { name: brand.name, address: brand.address, mapUrl: brand.mapUrl };
}

/** Split a brand address into rendering lines. Returns [] when blank. */
export function brandAddressLines(address: string = brand.address): string[] {
  return address
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}
