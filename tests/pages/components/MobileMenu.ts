import { Page, Locator, Response, expect } from '@playwright/test';
import { BasePage, ViewName } from '../BasePage';

// Hamburger menu shown at phone widths: #menu-button toggles #nav-menu (class "open")
export class MobileMenu {
  private readonly base: BasePage;
  private readonly page: Page;
  readonly toggle: Locator;
  readonly menu: Locator;

  constructor(base: BasePage, page: Page) {
    this.page = page;
    this.base = base;
    this.toggle = base.frame.locator('#menu-button');
    this.menu = base.navMenu;
  }

  // BasePage.navigateTo waits for the nav to be visible, but on a phone it is collapsed
  // behind the hamburger — wait for the toggle instead
  async navigateTo(path = '/'): Promise<Response | null> {
    const response = await this.page.goto(path, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await expect(this.toggle).toBeVisible({ timeout: 20000 });
    return response;
  }

  // Retry until the menu reports open: an early click may land before Canva's handlers attach.
  // Only click while it is still closed, so a late handler can't toggle it shut again.
  async open() {
    await expect(async () => {
      if (await this.toggle.getAttribute('aria-expanded') !== 'true') {
        await this.toggle.click();
      }
      await expect(this.toggle).toHaveAttribute('aria-expanded', 'true', { timeout: 1000 });
    }).toPass({ timeout: 10000 });
  }

  async goToView(view: ViewName) {
    await this.base.navButton(view).click();
    await expect(this.base.viewSection(view)).toHaveClass(/\bactive\b/);
  }
}
