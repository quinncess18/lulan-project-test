import { test, expect } from '../../fixtures/network-guard';
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

test.describe('Pages - header and footer', () => {
  for (const { label, view } of VIEWS) {
    test(`header and footer are visible on the ${label} view`, async ({ page }) => {
      const viewPage = new ViewPage(page, view);
      const header = new SiteHeader(viewPage);
      const footer = new SiteFooter(viewPage);
      await viewPage.navigateTo();
      await viewPage.open();

      await expect(header.brand).toBeVisible();
      await expect(header.primaryNav).toBeVisible();
      await expect(header.quoteButton).toBeVisible();
      await expect(footer.footerNav).toBeVisible();
      await expect(footer.footerNav.getByRole('button')).toHaveText(VIEWS.map(v => v.label));
    });
  }
});

test.describe('Pages - footer and brand navigation', () => {
  for (const { label, view } of VIEWS) {
    test(`footer "${label}" button switches to the ${label} view`, async ({ page }) => {
      const base = new BasePage(page);
      const footer = new SiteFooter(base);
      await base.navigateTo();
      // Start somewhere else so the Home button has a real switch to make
      if (view === 'home') await base.goToView('it');

      await footer.goToView(view);

      await expect(base.viewSection(view)).toHaveClass(/\bactive\b/);
      for (const other of VIEWS.filter(v => v.view !== view)) {
        await expect(base.viewSection(other.view)).toBeHidden();
      }
    });
  }

  test('brand/logo button returns to Home from another view', async ({ page }) => {
    const base = new BasePage(page);
    const header = new SiteHeader(base);
    await base.navigateTo();
    await base.goToView('rental');
    await expect(base.viewSection('home')).toBeHidden();

    await header.clickBrand();

    await expect(base.viewSection('home')).toHaveClass(/\bactive\b/);
    await expect(base.viewSection('rental')).toBeHidden();
  });
});
