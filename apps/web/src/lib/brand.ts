/**
 * Operator-configurable branding shown on public profile pages.
 *
 * Set these in `apps/web/.env.local` (NEXT_PUBLIC_ vars are exposed to the
 * browser). All fields fall back to neutral defaults so a fresh clone looks
 * presentable without any configuration.
 *
 * NOTE: the "Powered by Intelligaia" attribution rendered on the landing page
 * is a license requirement (ISAL v1.0 §4) and is intentionally NOT configurable
 * here. To remove it, obtain a commercial license — see COMMERCIAL_USE.md.
 */
export const brand = {
  /** Full legal / display name shown on the profile contact card. */
  name: process.env.NEXT_PUBLIC_BRAND_NAME || "Your Company",
  /** Short brand label used for logo alt text. */
  shortName: process.env.NEXT_PUBLIC_BRAND_SHORT_NAME || "Logo",
  /** Domain shown on the profile contact card (e.g. "example.com"). */
  website: process.env.NEXT_PUBLIC_BRAND_WEBSITE || "example.com",
  /** Optional tagline shown under the logo. Hidden when empty. */
  tagline: process.env.NEXT_PUBLIC_BRAND_TAGLINE || "",
  /** Optional subtitle under the company name on the contact card. */
  subtitle: process.env.NEXT_PUBLIC_BRAND_SUBTITLE || "",
  /** Multi-line address. Use \n for line breaks. Address block hidden when empty. */
  address: process.env.NEXT_PUBLIC_BRAND_ADDRESS || "",
  /** Optional Maps URL for the "Get directions" button. Button hidden when empty. */
  mapUrl: process.env.NEXT_PUBLIC_BRAND_MAP_URL || "",
  /** Path or URL to the light-background (dark-fill) logo. */
  logoLight: process.env.NEXT_PUBLIC_BRAND_LOGO_LIGHT || "/profile/logo.svg",
  /** Path or URL to the dark-background (light-fill) logo. */
  logoDark: process.env.NEXT_PUBLIC_BRAND_LOGO_DARK || "/profile/logo-dark.svg",
} as const;

/** Split the address into rendering lines. Returns [] when address is empty. */
export function brandAddressLines(): string[] {
  return brand.address
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}
