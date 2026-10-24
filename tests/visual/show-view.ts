import { Page } from '@playwright/test';
import { BasePage, ViewName, MobileMenu } from '../pages';

// Opens a view at any screen width: through the hamburger menu when it is shown, else the nav
export async function showView(page: Page, view: ViewName): Promise<BasePage> {
  const base = new BasePage(page);
  const menu = new MobileMenu(base, page);
  await base.navigateTo();
  if (view !== 'home') {
    if (await menu.toggle.isVisible()) {
      await menu.open();
      await menu.goToView(view);
    } else {
      await base.goToView(view);
    }
  }
  await base.fitViewportToPage();
  await base.waitForStableRender();
  return base;
}
