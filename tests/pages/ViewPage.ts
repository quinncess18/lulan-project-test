import { Page, Locator } from '@playwright/test';
import { BasePage, ViewName } from './BasePage';

// Base for the five nav views (Home, Logistics, Travel & Tours, Car Rental, IT Services)
export class ViewPage extends BasePage {
  readonly view: ViewName;
  readonly section: Locator;
  readonly heading: Locator;

  constructor(page: Page, view: ViewName) {
    super(page);
    this.view = view;
    this.section = this.viewSection(view);
    this.heading = this.section.locator('h1');
  }

  async open() {
    await this.goToView(this.view);
  }
}
