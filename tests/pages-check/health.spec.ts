import { test, expect } from '../../fixtures/network-guard';
import { Locator } from '@playwright/test';
import { BasePage, ViewName } from '../pages/BasePage';
import { ViewPage } from '../pages/ViewPage';
import { SiteHeader } from '../pages/components/SiteHeader';
import { SiteFooter } from '../pages/components/SiteFooter';

const VIEWS: { label: string; view: ViewName }[] = [
  { label: 'Home', view: 'home' },
  { label: 'Logistics', view: 'logistics' },
  { label: 'Travel & Tours', view: 'travel' },
  { label: 'Car Rental', view: 'rental' },
  { label: 'IT Services', view: 'it' },
];

// Images are lazy-loaded: scroll each one into view, then wait for it to decode
async function expectImagesLoaded(images: Locator[]) {
  for (const image of images) {
    await image.scrollIntoViewIfNeeded();
    const src = await image.getAttribute('src');
    await expect.poll(
      () => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0),
      { message: `Broken image: ${src}` },
    ).toBe(true);
  }
}

test.describe('Pages - health', () => {
  for (const { label, view } of VIEWS) {
    test(`no broken images on the ${label} view`, async ({ page }) => {
      const viewPage = new ViewPage(page, view);
      await viewPage.navigateTo();
      await viewPage.open();

      // Every content image on the site has alt text, so alt-text lookup finds them all
      const images = await viewPage.section.getByAltText(/.*/).all();
      expect(images.length, `${label} view should have at least one image`).toBeGreaterThan(0);
      await expectImagesLoaded(images);
    });
  }

  test('header and footer logos load', async ({ page }) => {
    const base = new BasePage(page);
    await base.navigateTo();

    await expectImagesLoaded([new SiteHeader(base).logo, new SiteFooter(base).logo]);
  });

  test('links that open a new tab use rel="noopener"', async ({ page }) => {
    const base = new BasePage(page);
    await base.navigateTo();

    // Today the site has no <a href> at all (navigation is buttons) — this guards future links
    const unsafe = await base.frame.getByRole('link').evaluateAll((links: HTMLAnchorElement[]) =>
      links
        .filter(a => a.target === '_blank' && !/\bnoopener\b/.test(a.rel))
        .map(a => a.href));
    expect(unsafe).toEqual([]);
  });
});
