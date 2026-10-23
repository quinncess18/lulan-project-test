import { Page, Locator, FrameLocator, Response, expect } from '@playwright/test';

export type ViewName = 'home' | 'logistics' | 'travel' | 'rental' | 'it';

export class BasePage {
  protected readonly page: Page;
  // All site content lives inside Canva's embedded iframe (served from *.canvacode.com)
  readonly frame: FrameLocator;
  readonly navMenu: Locator;

  constructor(page: Page) {
    this.page = page;
    this.frame = page.frameLocator('iframe[title="Embedded content"]');
    this.navMenu = this.frame.locator('#nav-menu');
  }

  async navigateTo(path = '/'): Promise<Response | null> {
    const response = await this.page.goto(path, { waitUntil: 'domcontentloaded', timeout: 30000 });
    // The outer page is an empty shell; wait until Canva has rendered the site inside the iframe.
    // Canva occasionally takes >10s to render, so allow longer than the default expect timeout.
    await expect(this.navMenu).toBeVisible({ timeout: 20000 });
    return response;
  }

  navButton(view: ViewName): Locator {
    return this.navMenu.locator(`[data-view-link="${view}"]`);
  }

  viewSection(view: ViewName): Locator {
    return this.frame.locator(`section.page-view[data-view="${view}"]`);
  }

  // Views switch in place (no URL change): the chosen section gets the "active" class.
  // The nav can render before Canva's script attaches click handlers, so an early click
  // may be ignored — retry the click until the view activates.
  async goToView(view: ViewName) {
    await expect(async () => {
      await this.navButton(view).click();
      await expect(this.viewSection(view)).toHaveClass(/\bactive\b/, { timeout: 1000 });
    }).toPass({ timeout: 10000 });
  }

  async wait(ms: number) {
    await this.page.waitForTimeout(ms);
  }

  // Asserts that the given locator is visible on the page
  async isElementVisible(locator: Locator) {
    await expect(locator).toBeVisible();
  }
}
