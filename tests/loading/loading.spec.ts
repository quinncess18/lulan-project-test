import { test, expect } from '../../fixtures/network-guard';
import { HomeView, LogisticsView, TravelView, RentalView, ItServicesView, LoadMetrics } from '../pages';

// Budgets are generous: measured 2026-10-23 on a cold load (DOMContentLoaded 2.96 s, load 4.89 s,
// site visible 4.97 s, 2.85 MB). Live-site timing is noisy — tighten after watching a few runs.
const BUDGET = { domContentLoadedMs: 4000, loadMs: 7000, visibleMs: 8000, megabytes: 4 };

test.describe('Loading - homepage budgets', () => {
  test('DOMContentLoaded and load events are within budget', async ({ page }) => {
    const home = new HomeView(page);
    const metrics = new LoadMetrics(page);
    await home.navigateTo();

    const timing = await metrics.navigationTiming();
    expect(timing.domContentLoaded, 'DOMContentLoaded (ms)').toBeLessThan(BUDGET.domContentLoadedMs);
    expect(timing.load, 'load (ms)').toBeLessThan(BUDGET.loadMs);
  });

  test('the site is drawn inside the Canva iframe within budget', async ({ page }) => {
    const home = new HomeView(page);
    const started = Date.now();
    await home.navigateTo();

    expect(Date.now() - started, 'time until the nav is visible (ms)').toBeLessThan(BUDGET.visibleMs);
  });

  test('page weight stays under budget', async ({ page }) => {
    const home = new HomeView(page);
    const metrics = new LoadMetrics(page);
    await home.navigateTo();
    await page.waitForLoadState('networkidle');

    expect(metrics.megabytes, 'transferred response bodies (MB)').toBeLessThan(BUDGET.megabytes);
  });
});

test.describe('Loading - asset health', () => {
  test('no failed requests while loading and visiting every view', async ({ page }) => {
    const metrics = new LoadMetrics(page);
    const home = new HomeView(page);
    await home.navigateTo();
    for (const view of [new LogisticsView(page), new TravelView(page), new RentalView(page), new ItServicesView(page), home]) {
      await view.open();
    }
    await page.waitForLoadState('networkidle');

    expect(metrics.failedRequests).toEqual([]);
  });
});

test.describe('Loading - slow network', () => {
  // Measured 2026-10-23 on Fast 3G: site visible after ~14.8 s, load event after ~17.5 s
  test('the site still renders and works on a Fast 3G connection', async ({ page }) => {
    test.setTimeout(90000);
    const metrics = new LoadMetrics(page);
    await metrics.throttleToFast3G();
    const home = new HomeView(page);
    const travel = new TravelView(page);

    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await expect(home.navMenu).toBeVisible({ timeout: 30000 });
    await travel.open();

    await expect(travel.heading).toBeVisible();
  });
});
