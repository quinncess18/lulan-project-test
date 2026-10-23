import { test, expect } from '../../fixtures/network-guard';
import { BasePage } from '../pages/BasePage';
import { MobileMenu } from '../pages/components/MobileMenu';

test.describe('Pages - mobile menu', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('hamburger opens the menu, a nav button switches view, and the menu closes', async ({ page }) => {
    const base = new BasePage(page);
    const mobileMenu = new MobileMenu(base, page);
    await mobileMenu.navigateTo();

    // Collapsed by default on a phone
    await expect(mobileMenu.toggle).toBeVisible();
    await expect(mobileMenu.toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(mobileMenu.menu).toBeHidden();

    await mobileMenu.open();
    await expect(mobileMenu.menu).toBeVisible();
    await expect(mobileMenu.menu).toHaveClass(/\bopen\b/);

    await mobileMenu.goToView('travel');

    await expect(base.viewSection('home')).toBeHidden();
    await expect(mobileMenu.toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(mobileMenu.menu).toBeHidden();
  });
});
