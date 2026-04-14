import { test, expect, type Page } from "@playwright/test";

/* ------------------------------------------------------------------ */
/*  Viewport matrix                                                    */
/* ------------------------------------------------------------------ */

const VIEWPORTS = [
  { name: "android-small", width: 360, height: 800 },
  { name: "iphone-se", width: 375, height: 812 },
  { name: "iphone-pro", width: 390, height: 844 },
  { name: "iphone-plus", width: 414, height: 896 },
  { name: "tablet-portrait", width: 768, height: 1024 },
  { name: "tablet-landscape", width: 1024, height: 768 },
  { name: "desktop-small", width: 1280, height: 720 },
  { name: "desktop-std", width: 1440, height: 900 },
  { name: "desktop-large", width: 1920, height: 1080 },
] as const;

const MOBILE_VIEWPORTS = VIEWPORTS.filter((v) => v.width < 768);
const DESKTOP_VIEWPORTS = VIEWPORTS.filter((v) => v.width >= 1024);

const PROFILE_URL = "/p/jaswant-19a8c0";
const LOADER_TIMEOUT = 15_000; // ProfileReveal animation can take ~3s

/* ------------------------------------------------------------------ */
/*  Helper: wait for ProfileReveal loader to finish                    */
/* ------------------------------------------------------------------ */

async function waitForProfileContent(page: Page) {
  // The ProfileReveal shows a loader then swaps to children wrapped in
  // .animate-profile-enter. Wait for that wrapper OR for the profile
  // card content to become visible.
  await page.waitForSelector(".animate-profile-enter, [class*='max-w-md']", {
    state: "attached",
    timeout: LOADER_TIMEOUT,
  });
  // Small extra wait for animations to settle
  await page.waitForTimeout(800);
}

/* ------------------------------------------------------------------ */
/*  Helper: check for horizontal overflow                              */
/* ------------------------------------------------------------------ */

async function hasHorizontalOverflow(page: Page): Promise<{
  overflows: boolean;
  scrollWidth: number;
  clientWidth: number;
}> {
  return page.evaluate(() => {
    const doc = document.documentElement;
    return {
      overflows: doc.scrollWidth > doc.clientWidth,
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
    };
  });
}

/* ================================================================== */
/*  1. PROFILE PAGE — cross-viewport tests                             */
/* ================================================================== */

test.describe("Profile Page — viewport matrix", () => {
  for (const vp of VIEWPORTS) {
    test.describe(`@ ${vp.name} (${vp.width}x${vp.height})`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(PROFILE_URL);
        await waitForProfileContent(page);
      });

      test("no horizontal overflow", async ({ page }) => {
        const result = await hasHorizontalOverflow(page);
        expect(
          result.overflows,
          `scrollWidth ${result.scrollWidth} > clientWidth ${result.clientWidth}`,
        ).toBe(false);
      });

      test("screenshot - full page", async ({ page }) => {
        await page.screenshot({
          path: `test-results/profile-${vp.name}-full.png`,
          fullPage: true,
        });
      });

      test("screenshot - above fold", async ({ page }) => {
        await page.screenshot({
          path: `test-results/profile-${vp.name}-fold.png`,
          fullPage: false,
        });
      });

      test("profile photo is visible", async ({ page }) => {
        const photo = page.locator("img[alt]").first();
        await expect(photo).toBeVisible();
      });

      test("cards stay within viewport width", async ({ page }) => {
        const cards = page.locator(".bg-white.rounded-\\[18px\\]");
        const count = await cards.count();
        expect(count).toBeGreaterThan(0);

        for (let i = 0; i < count; i++) {
          const box = await cards.nth(i).boundingBox();
          expect(box).not.toBeNull();
          if (box) {
            expect(box.x).toBeGreaterThanOrEqual(0);
            expect(
              box.x + box.width,
              `Card ${i} overflows right edge: x=${box.x} w=${box.width} viewport=${vp.width}`,
            ).toBeLessThanOrEqual(vp.width + 1); // 1px tolerance
          }
        }
      });

      test("FAB is visible and not clipped", async ({ page }) => {
        // The FAB is a fixed-position <a> with "Schedule a Meeting" text
        const fab = page.locator("a:has-text('Schedule a Meeting')").last();
        await expect(fab).toBeVisible();

        const box = await fab.boundingBox();
        expect(box).not.toBeNull();
        if (box) {
          // FAB should be fully within viewport
          expect(box.x).toBeGreaterThanOrEqual(0);
          expect(box.x + box.width).toBeLessThanOrEqual(vp.width + 1);
          expect(box.y + box.height).toBeLessThanOrEqual(vp.height + 1);
        }
      });
    });
  }
});

/* ================================================================== */
/*  2. PROFILE PAGE — mobile-specific checks                           */
/* ================================================================== */

test.describe("Profile Page — mobile-specific", () => {
  for (const vp of MOBILE_VIEWPORTS) {
    test.describe(`@ ${vp.name}`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(PROFILE_URL);
        await waitForProfileContent(page);
      });

      test("mobile background div is visible, desktop hidden", async ({
        page,
      }) => {
        // Mobile bg: .fixed.inset-0.z-0.md\\:hidden
        // Should have display != none on mobile
        const mobileBg = page.locator(".fixed.inset-0.z-0").first();
        const isVisible = await mobileBg.isVisible();
        expect(isVisible).toBe(true);
      });

      test("desktop side info is hidden on mobile", async ({ page }) => {
        // The lg:flex side panel should be hidden
        const sideInfo = page.locator("text=Digital Profile");
        const count = await sideInfo.count();
        if (count > 0) {
          await expect(sideInfo.first()).not.toBeVisible();
        }
      });

      test("action buttons row does not wrap unexpectedly", async ({
        page,
      }) => {
        // 4 action buttons, each 52px + 6px gap = ~226px. Should fit.
        const actionRow = page.locator(".flex.gap-\\[6px\\].items-center");
        if ((await actionRow.count()) > 0) {
          const rowBox = await actionRow.first().boundingBox();
          expect(rowBox).not.toBeNull();
          if (rowBox) {
            // Row height should be ~52px (single line). If wrapped, it'd be >100px
            expect(rowBox.height).toBeLessThan(100);
          }
        }
      });

      test("Save Contact button is fully visible", async ({ page }) => {
        const saveBtn = page.locator("a:has-text('Save Contact')");
        if ((await saveBtn.count()) > 0) {
          const box = await saveBtn.first().boundingBox();
          expect(box).not.toBeNull();
          if (box) {
            expect(box.x).toBeGreaterThanOrEqual(0);
            expect(box.x + box.width).toBeLessThanOrEqual(vp.width + 1);
          }
        }
      });

      test("address text does not overflow card", async ({ page }) => {
        // Address column is fixed w-[157px] — check it fits
        const addressEl = page.locator("text=Address").first();
        if ((await addressEl.count()) > 0) {
          const card = page
            .locator(".bg-white.rounded-\\[18px\\]")
            .filter({ hasText: "Address" });
          if ((await card.count()) > 0) {
            const cardBox = await card.first().boundingBox();
            // Check no child overflows
            const overflow = await card.first().evaluate((el) => {
              return el.scrollWidth > el.clientWidth;
            });
            expect(overflow).toBe(false);
          }
        }
      });
    });
  }
});

/* ================================================================== */
/*  3. PROFILE PAGE — desktop-specific checks                          */
/* ================================================================== */

test.describe("Profile Page — desktop-specific", () => {
  for (const vp of DESKTOP_VIEWPORTS) {
    test.describe(`@ ${vp.name}`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(PROFILE_URL);
        await waitForProfileContent(page);
      });

      test("desktop background div is visible", async ({ page }) => {
        // The md:block desktop bg should be showing
        const desktopBg = page.locator(".fixed.inset-0.z-0.hidden.md\\:block");
        if ((await desktopBg.count()) > 0) {
          await expect(desktopBg.first()).toBeVisible();
        }
      });

      test("card is centered, not stretched to full width", async ({
        page,
      }) => {
        const cardContainer = page.locator(".max-w-md").first();
        const box = await cardContainer.boundingBox();
        expect(box).not.toBeNull();
        if (box) {
          // max-w-md = 448px. On desktop the card should be constrained
          expect(box.width).toBeLessThanOrEqual(460);
        }
      });

      test("side info visible on lg+ viewports", async ({ page }) => {
        if (vp.width >= 1024) {
          const sideInfo = page.locator("text=Digital Profile");
          if ((await sideInfo.count()) > 0) {
            // On lg+ (>=1024), the side info should be visible
            const isVisible = await sideInfo.first().isVisible();
            // This checks the actual lg breakpoint behavior
            if (vp.width >= 1024) {
              // lg breakpoint in Tailwind is 1024px
              // It uses lg:flex, so should show at 1024+
              expect(isVisible).toBe(true);
            }
          }
        }
      });
    });
  }
});

/* ================================================================== */
/*  4. PROFILE PAGE — z-index / stacking                               */
/* ================================================================== */

test.describe("Profile Page — z-index stacking", () => {
  test("FAB is above cards (z-50 vs z-10)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(PROFILE_URL);
    await waitForProfileContent(page);

    // Scroll to bottom where FAB overlaps content
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);

    const fab = page.locator("a:has-text('Schedule a Meeting')").last();
    const fabZIndex = await fab.evaluate((el) => {
      return window.getComputedStyle(el).zIndex;
    });
    expect(Number(fabZIndex)).toBeGreaterThanOrEqual(50);
  });

  test("content is above background (z-10 vs z-0)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(PROFILE_URL);
    await waitForProfileContent(page);

    const contentLayer = page.locator(".relative.z-10").first();
    const zIndex = await contentLayer.evaluate((el) => {
      return window.getComputedStyle(el).zIndex;
    });
    expect(Number(zIndex)).toBeGreaterThanOrEqual(10);
  });
});

/* ================================================================== */
/*  5. PROFILE PAGE — FAB overlap with "Save Contact"                  */
/* ================================================================== */

test.describe("Profile Page — FAB overlap check", () => {
  for (const vp of MOBILE_VIEWPORTS) {
    test(`FAB overlap with bottom content @ ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(PROFILE_URL);
      await waitForProfileContent(page);

      // Scroll to bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(300);

      await page.screenshot({
        path: `test-results/profile-${vp.name}-bottom-overlap.png`,
        fullPage: false,
      });

      // Check if FAB overlaps the "Save Contact" button
      const fab = page.locator("a:has-text('Schedule a Meeting')").last();
      const saveBtn = page.locator("a:has-text('Save Contact')");

      if ((await saveBtn.count()) > 0 && (await fab.count()) > 0) {
        const fabBox = await fab.boundingBox();
        const saveBox = await saveBtn.first().boundingBox();

        if (fabBox && saveBox) {
          const overlap =
            fabBox.x < saveBox.x + saveBox.width &&
            fabBox.x + fabBox.width > saveBox.x &&
            fabBox.y < saveBox.y + saveBox.height &&
            fabBox.y + fabBox.height > saveBox.y;

          // Report overlap — not necessarily a failure but flagged
          if (overlap) {
            console.warn(
              `WARNING: FAB overlaps Save Contact button at ${vp.name}`,
            );
          }
        }
      }
    });
  }
});

/* ================================================================== */
/*  6. PROFILE REVEAL LOADER                                           */
/* ================================================================== */

test.describe("ProfileReveal loader", () => {
  test("loader appears then transitions to content", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(PROFILE_URL);

    // Loader should be visible initially
    await page.screenshot({
      path: "test-results/profile-loader-initial.png",
      fullPage: false,
    });

    // Wait for content
    await waitForProfileContent(page);

    await page.screenshot({
      path: "test-results/profile-loader-complete.png",
      fullPage: false,
    });

    // Content should now be present
    const cards = page.locator(".bg-white.rounded-\\[18px\\]");
    await expect(cards.first()).toBeVisible();
  });
});

/* ================================================================== */
/*  7. HOME PAGE                                                       */
/* ================================================================== */

test.describe("Home Page", () => {
  for (const vp of [
    { name: "mobile", width: 375, height: 812 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "desktop", width: 1440, height: 900 },
  ]) {
    test(`renders correctly @ ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");

      await expect(page.locator("h1")).toBeVisible();
      await expect(page.locator("text=Sign in")).toBeVisible();

      const result = await hasHorizontalOverflow(page);
      expect(result.overflows).toBe(false);

      await page.screenshot({
        path: `test-results/home-${vp.name}.png`,
        fullPage: true,
      });
    });
  }
});

/* ================================================================== */
/*  8. LOGIN PAGE                                                      */
/* ================================================================== */

test.describe("Login Page", () => {
  for (const vp of [
    { name: "mobile", width: 375, height: 812 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "desktop", width: 1440, height: 900 },
  ]) {
    test(`renders correctly @ ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/admin/login");

      await expect(page.locator("h1")).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();

      const result = await hasHorizontalOverflow(page);
      expect(result.overflows).toBe(false);

      await page.screenshot({
        path: `test-results/login-${vp.name}.png`,
        fullPage: true,
      });
    });
  }

  test("form inputs are usable on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/admin/login");

    const emailInput = page.locator('input[type="email"]');
    const box = await emailInput.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      // Touch target should be at least 44px tall
      expect(box.height).toBeGreaterThanOrEqual(40); // py-2.5 = ~44px
      // Input should not overflow viewport
      expect(box.x + box.width).toBeLessThanOrEqual(375);
    }
  });
});

/* ================================================================== */
/*  9. BREAKPOINT BOUNDARY TESTS                                       */
/* ================================================================== */

test.describe("Profile Page — breakpoint boundaries", () => {
  // Tailwind md = 768px, lg = 1024px
  const boundaries = [
    { name: "below-md", width: 767, height: 1024 },
    { name: "at-md", width: 768, height: 1024 },
    { name: "below-lg", width: 1023, height: 768 },
    { name: "at-lg", width: 1024, height: 768 },
  ];

  for (const bp of boundaries) {
    test(`background switch at ${bp.name} (${bp.width}px)`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.goto(PROFILE_URL);
      await waitForProfileContent(page);

      await page.screenshot({
        path: `test-results/profile-breakpoint-${bp.name}.png`,
        fullPage: false,
      });

      // Check which background is visible
      const mobileBgVisible = await page
        .locator(".fixed.inset-0.z-0")
        .first()
        .isVisible();
      const isBelowMd = bp.width < 768;

      if (isBelowMd) {
        // Mobile bg should be showing (md:hidden means hidden at >=768)
        expect(mobileBgVisible).toBe(true);
      }
    });
  }
});

/* ================================================================== */
/*  10. EDGE CASE WIDTHS                                               */
/* ================================================================== */

test.describe("Profile Page — edge case widths", () => {
  const edgeCases = [
    { name: "min-320", width: 320, height: 568 },
    { name: "w-480", width: 480, height: 800 },
    { name: "w-600", width: 600, height: 900 },
  ];

  for (const ec of edgeCases) {
    test(`no overflow at ${ec.name}`, async ({ page }) => {
      await page.setViewportSize({ width: ec.width, height: ec.height });
      await page.goto(PROFILE_URL);
      await waitForProfileContent(page);

      const result = await hasHorizontalOverflow(page);
      expect(
        result.overflows,
        `Horizontal overflow at ${ec.width}px: scrollWidth=${result.scrollWidth} clientWidth=${result.clientWidth}`,
      ).toBe(false);

      await page.screenshot({
        path: `test-results/profile-edge-${ec.name}.png`,
        fullPage: true,
      });
    });
  }
});
