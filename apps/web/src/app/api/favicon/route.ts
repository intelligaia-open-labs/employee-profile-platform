import { NextRequest, NextResponse } from "next/server";

/**
 * Generates an SVG favicon with an initial letter.
 * Usage: /api/favicon?letter=J
 */
export async function GET(req: NextRequest) {
  const letter = (req.nextUrl.searchParams.get("letter") || "?").charAt(0).toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#18181b"/>
  <text x="32" y="44" text-anchor="middle" font-family="system-ui,sans-serif" font-size="32" font-weight="700" fill="#fff">${letter}</text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
