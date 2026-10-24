import { test, expect } from '../../fixtures/network-guard';
import { Page } from '@playwright/test';
import { HomeView, LogisticsView, TravelView, RentalView, ItServicesView, ViewPage } from '../pages';

const VIEWS: { label: string; create: (page: Page) => ViewPage; heading: string }[] = [
  { label: 'Home', create: p => new HomeView(p), heading: 'Move farther. Travel better. Work smarter.' },
  { label: 'Logistics', create: p => new LogisticsView(p), heading: 'Freight that keeps its promises.' },
  { label: 'Travel & Tours', create: p => new TravelView(p), heading: 'Philippine journeys, thoughtfully arranged.' },
  { label: 'Car Rental', create: p => new RentalView(p), heading: 'The right vehicle for every route.' },
  { label: 'IT Services', create: p => new ItServicesView(p), heading: 'Technology supplied, installed, and supported.' },
];

test.describe('Smoke - site health', () => {
  test('homepage returns 200 and renders the main heading', async ({ page }) => {
    const home = new HomeView(page);
    const response = await home.navigateTo();

    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle('LULAN PH Multi-Service Website');
    await expect(home.section).toHaveClass(/\bactive\b/);
    await expect(home.heading).toHaveText(VIEWS[0].heading);
  });

  for (const { label, create, heading } of VIEWS.slice(1)) {
    test(`${label} view opens from the nav and shows its heading`, async ({ page }) => {
      const view = create(page);
      await view.navigateTo();
      await view.open();

      await expect(view.heading).toBeVisible();
      await expect(view.heading).toHaveText(heading);
      // Only one view is shown at a time
      await expect(new HomeView(page).heading).toBeHidden();
    });
  }

  test('no uncaught JS errors while loading and switching views', async ({ page }) => {
    const errors: string[] = [];
    // Known (LUL-018): in WebKit, Canva's wrapper script throws a cross-origin error on every load
    const knownError = /Blocked a frame with origin "https:\/\/lulan\.com\.ph"/;
    page.on('pageerror', e => {
      if (!knownError.test(e.stack ?? e.message)) errors.push(`pageerror: ${e.message}`);
    });
    // Firefox logs its own rejection of Cloudflare's __cf_bm cookie (set by the Canva iframe host)
    // as a console error. That's browser cookie policy, not a script error on the site.
    const browserNotice = /Cookie “__cf_bm” has been rejected/;
    page.on('console', m => {
      if (m.type() === 'error' && !browserNotice.test(m.text())) errors.push(`console.error: ${m.text()}`);
    });

    const home = new HomeView(page);
    await home.navigateTo();
    for (const { create } of VIEWS) {
      await create(page).open();
    }

    expect(errors).toEqual([]);
  });

  test('primary navigation buttons are visible and enabled', async ({ page }) => {
    const home = new HomeView(page);
    await home.navigateTo();
    const buttons = home.navMenu.getByRole('button');

    await expect(buttons).toHaveText(VIEWS.map(v => v.label));
    for (const button of await buttons.all()) {
      await expect(button).toBeEnabled();
    }
  });

  test('unknown path returns a 404 page, not a blank page or 500', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist');

    expect(response?.status()).toBe(404);
    await expect(page).toHaveTitle('Not found');
  });
});
