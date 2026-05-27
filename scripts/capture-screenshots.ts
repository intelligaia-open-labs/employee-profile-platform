/**
 * Captures the screenshots referenced from the README.
 *
 * Prerequisites:
 *   - API running on http://localhost:4000
 *   - Web running on http://localhost:3000
 *   - Admin admin@example.com / demo-admin-pass-2026 (created by scripts/seed-demo.ts)
 *   - At least one active employee in the database
 *
 * Run with: npx tsx scripts/capture-screenshots.ts
 */
import { chromium, devices, type BrowserContext, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@business-profile/db";

const API = process.env.API_URL || "http://localhost:4000";
const WEB = process.env.WEB_URL || "http://localhost:3000";
const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "demo-admin-pass-2026";

const OUT = path.resolve(__dirname, "..", "docs", "screenshots");

// Hide the Next.js dev overlay button so it doesn't show in shots and
// doesn't intercept clicks.
const HIDE_DEV_OVERLAY = "nextjs-portal { display: none !important; }";

async function hideDevOverlay(page: Page) {
  await page.addStyleTag({ content: HIDE_DEV_OVERLAY }).catch(() => {});
}

async function loginAsAdmin(): Promise<string> {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const cookie = res.headers.getSetCookie?.()[0] ?? res.headers.get("set-cookie");
  if (!res.ok || !cookie) {
    throw new Error(`admin login failed (${res.status}): ${await res.text()}`);
  }
  const token = cookie.split(";")[0].split("=")[1];
  return token;
}

async function attachAuth(ctx: BrowserContext, token: string) {
  await ctx.addCookies([
    {
      name: "token",
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  ]);
}

async function pickDemoSlug(): Promise<{ slug: string; id: string }> {
  const employees = await prisma.employee.findMany({
    where: { is_active: true },
    select: { id: true, slug: true, full_name: true },
    orderBy: { created_at: "desc" },
  });
  const demo =
    employees.find((e) => e.slug.startsWith("alex-morgan")) ||
    employees.find((e) => e.slug.startsWith("priya-sharma")) ||
    employees.find((e) => !e.slug.startsWith("jaswant-")) ||
    employees[0];
  if (!demo) throw new Error("No active employees in DB — run scripts/seed-demo.ts first");
  console.log(`Using demo employee: ${demo.full_name} (${demo.slug})`);
  return { slug: demo.slug, id: demo.id };
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const token = await loginAsAdmin();
  const { slug, id } = await pickDemoSlug();

  const browser = await chromium.launch();

  // 1. Public profile — desktop
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${WEB}/p/${slug}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(4000);
    await hideDevOverlay(page);
    await page.screenshot({ path: path.join(OUT, "profile-desktop.png"), fullPage: false });
    console.log("✓ profile-desktop.png");
    await ctx.close();
  }

  // 2. Public profile — mobile
  {
    const ctx = await browser.newContext({ ...devices["iPhone 13"] });
    const page = await ctx.newPage();
    await page.goto(`${WEB}/p/${slug}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(4000);
    await hideDevOverlay(page);
    await page.screenshot({ path: path.join(OUT, "profile-mobile.png"), fullPage: false });
    console.log("✓ profile-mobile.png");
    await ctx.close();
  }

  // 3. QR share modal (on desktop public profile)
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${WEB}/p/${slug}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(5000);
    await hideDevOverlay(page);
    // ProfileReveal renders children twice (hidden preloader + visible copy).
    // Scope to the visible .animate-content-enter container so the click
    // toggles state on the rendered copy, not the offscreen one.
    const visibleQr = page
      .locator(".animate-content-enter")
      .locator('button[aria-label="Show QR code"]');
    await visibleQr.waitFor({ state: "visible", timeout: 10000 });
    await visibleQr.click();
    await page
      .locator(".animate-content-enter")
      .locator("text=Scan to view profile")
      .waitFor({ state: "visible", timeout: 8000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(OUT, "qr-share.png"), fullPage: false });
    console.log("✓ qr-share.png");
    await ctx.close();
  }

  // 4. Admin dashboard
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await attachAuth(ctx, token);
    const page = await ctx.newPage();
    await page.goto(`${WEB}/admin`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await hideDevOverlay(page);
    await page.screenshot({ path: path.join(OUT, "admin-dashboard.png"), fullPage: false });
    console.log("✓ admin-dashboard.png");
    await ctx.close();
  }

  // 5. Per-employee analytics drill-down
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await attachAuth(ctx, token);
    const page = await ctx.newPage();
    await page.goto(`${WEB}/admin/analytics/${id}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await hideDevOverlay(page);
    await page.screenshot({ path: path.join(OUT, "analytics-detail.png"), fullPage: false });
    console.log("✓ analytics-detail.png");
    await ctx.close();
  }

  // 6. Employee self-service editor (uses the admin edit view as a proxy)
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await attachAuth(ctx, token);
    const page = await ctx.newPage();
    await page.goto(`${WEB}/admin/employees/${id}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await hideDevOverlay(page);
    await page.screenshot({ path: path.join(OUT, "employee-portal.png"), fullPage: false });
    console.log("✓ employee-portal.png");
    await ctx.close();
  }

  await browser.close();
  await prisma.$disconnect();
  console.log(`\nAll screenshots written to ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
