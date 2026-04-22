import { test, expect } from "@playwright/test";

const SLUG = "arjun-kumar-ecea8f";
const VIEWPORTS = [
  { name: "mobile-320", width: 320, height: 720 },
  { name: "mobile-375", width: 375, height: 812 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1280", width: 1280, height: 900 },
  { name: "desktop-1920", width: 1920, height: 1080 },
];

for (const vp of VIEWPORTS) {
  test(`profile layout @ ${vp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(`http://localhost:3005/p/${SLUG}`);

    // ProfileReveal renders the content twice (hidden prefetch + visible).
    // Wait for the visible copy (inside .animate-content-enter) to appear.
    await page.waitForSelector(".animate-content-enter h1", { timeout: 20_000 });
    await page.waitForTimeout(1200);

    const metrics = await page.evaluate(() => {
      const pick = (el: Element | null) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
      };
      const docW = document.documentElement.clientWidth;
      const scrollW = document.documentElement.scrollWidth;

      const root = document.querySelector(".animate-content-enter") as HTMLElement | null;
      const hero = root?.querySelector("div.absolute.bg-\\[\\#121212\\]") ?? null;
      const name = root?.querySelector("h1") ?? null;
      const logo = root?.querySelector('img[alt="Intelligaia"]') ?? null;
      const card = root?.querySelector(".bg-white.rounded-\\[18px\\]") ?? null;
      const photo = root?.querySelector(".rounded-full.border-4.border-white") ?? null;

      return {
        viewport: { w: docW, scrollW, horizontalScroll: scrollW > docW },
        hero: pick(hero),
        logo: pick(logo),
        photo: pick(photo),
        name: pick(name),
        card: pick(card),
      };
    });

    console.log(`[${vp.name}] ${JSON.stringify(metrics, null, 2)}`);

    // Assertions
    expect(metrics.viewport.horizontalScroll, "no horizontal scroll").toBe(false);
    expect(metrics.hero, "hero exists").not.toBeNull();
    // Hero should span the full viewport width
    expect(metrics.hero!.w, `hero full width @ ${vp.name}`).toBe(vp.width);
    // Hero bottom must be above the name block (name must sit on white bg)
    expect(metrics.name!.y, `name below hero @ ${vp.name}`).toBeGreaterThanOrEqual(metrics.hero!.y + metrics.hero!.h);
    // Profile photo should overlap the hero (center at or above hero bottom)
    const photoCenterY = metrics.photo!.y + metrics.photo!.h / 2;
    const heroBottom = metrics.hero!.y + metrics.hero!.h;
    expect(photoCenterY, `photo center at/near hero bottom @ ${vp.name}`).toBeLessThanOrEqual(heroBottom + 60);
    // Card width should fit within the constrained column
    expect(metrics.card!.w, `card constrained @ ${vp.name}`).toBeLessThanOrEqual(560 - 32 + 1);

    // Screenshot
    await page.screenshot({
      path: `test-results/profile-${vp.name}.png`,
      fullPage: true,
    });
  });
}
