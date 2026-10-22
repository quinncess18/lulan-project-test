import { test as base, expect, Page } from '@playwright/test';

type MyFixtures = {
  stablePage: Page;
};

export const test = base.extend<MyFixtures>({
  // Auto-wait for page stability before screenshots
  stablePage: async ({ page }, use) => {
    const originalGoto = page.goto.bind(page);
    page.goto = async (url, options) => {
      const response = await originalGoto(url, options);
      await page.waitForLoadState('networkidle');
      // Wait for fonts to load
      await page.evaluate(() => document.fonts.ready);
      // Wait for images
      await page.waitForFunction(() => {
        const images = Array.from(document.images);
        return images.every(img => img.complete);
      });
      return response;
    };
    await use(page);
  },
});

export { expect };