import { Locator, expect } from '@playwright/test';
import { BasePage, ViewName } from '../BasePage';

// Site footer (inside the Canva iframe): logo, summary, and the footer nav buttons
export class SiteFooter {
  private readonly base: BasePage;
  readonly root: Locator;
  readonly footerNav: Locator;
  readonly logo: Locator;

  constructor(base: BasePage) {
    this.base = base;
    this.root = base.frame.locator('footer.site-footer');
    this.footerNav = this.root.getByLabel('Footer navigation');
    this.logo = this.root.locator('.footer-brand img');
  }

  navButton(view: ViewName): Locator {
    return this.footerNav.locator(`[data-view-link="${view}"]`);
  }

  // Same retry pattern as BasePage.goToView: an early click may land before Canva's handlers attach
  async goToView(view: ViewName) {
    await expect(async () => {
      await this.navButton(view).click();
      await expect(this.base.viewSection(view)).toHaveClass(/\bactive\b/, { timeout: 1000 });
    }).toPass({ timeout: 10000 });
  }
}
