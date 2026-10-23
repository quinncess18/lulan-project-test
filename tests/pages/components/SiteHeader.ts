import { Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

// Site header (inside the Canva iframe): brand/logo button, primary nav, and "Get a quote"
export class SiteHeader {
  private readonly base: BasePage;
  readonly root: Locator;
  readonly primaryNav: Locator;
  readonly brand: Locator;
  readonly logo: Locator;
  readonly quoteButton: Locator;

  constructor(base: BasePage) {
    this.base = base;
    this.root = base.frame.locator('header.site-header');
    this.primaryNav = this.root.getByLabel('Primary navigation');
    this.brand = this.primaryNav.locator('button.brand');
    this.logo = this.brand.getByRole('img');
    this.quoteButton = this.root.getByRole('button', { name: 'Get a quote' });
  }

  // Same retry pattern as BasePage.goToView: an early click may land before Canva's handlers attach
  async clickBrand() {
    await expect(async () => {
      await this.brand.click();
      await expect(this.base.viewSection('home')).toHaveClass(/\bactive\b/, { timeout: 1000 });
    }).toPass({ timeout: 10000 });
  }
}
