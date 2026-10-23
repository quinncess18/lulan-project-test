import { Page, Locator } from '@playwright/test';
import { ViewPage } from './ViewPage';

export type ItCategory = 'Hardware' | 'Software' | 'Managed Services';

// Turns a displayed amount like '₱52,000.00' into a number
const toNumber = (text: string) => Number(text.replace(/[^\d.-]/g, ''));

export class ItServicesView extends ViewPage {
  // Catalog
  readonly categoryTabs: Locator;
  readonly productCards: Locator;
  readonly visibleProductCards: Locator;

  // Quote basket
  readonly basketItems: Locator;
  readonly basketEmpty: Locator;
  readonly basketTotal: Locator;
  readonly basketNote: Locator;
  readonly requestQuoteButton: Locator;
  readonly toast: Locator;

  constructor(page: Page) {
    super(page, 'it');

    this.categoryTabs = this.section.locator('#it-tabs .filter-tab');
    this.productCards = this.section.locator('.it-card');
    this.visibleProductCards = this.section.locator('.it-card:visible');

    this.basketItems = this.section.locator('#basket-items .basket-item');
    this.basketEmpty = this.section.locator('#basket-empty');
    this.basketTotal = this.section.locator('#basket-total');
    this.basketNote = this.section.locator('#basket-note');
    this.requestQuoteButton = this.section.getByRole('button', { name: 'Request quote' });
    this.toast = this.frame.locator('#toast');
  }

  categoryTab(category: ItCategory): Locator {
    return this.categoryTabs.filter({ hasText: category });
  }

  productCard(name: string): Locator {
    return this.productCards.filter({ has: this.frame.getByRole('heading', { name, exact: true }) });
  }

  // "Add to quote" is swapped for a check mark once the product is in the basket
  addButton(name: string): Locator {
    return this.productCard(name).getByRole('button', { name: 'Add to quote' });
  }

  basketItem(name: string): Locator {
    return this.basketItems.filter({ hasText: name });
  }

  async selectCategory(category: ItCategory) {
    await this.categoryTab(category).click();
  }

  async addToQuote(name: string) {
    await this.addButton(name).click();
  }

  async removeFromQuote(name: string) {
    await this.section.getByRole('button', { name: `Remove ${name}` }).click();
  }

  async requestQuote() {
    await this.requestQuoteButton.click();
  }

  async basketTotalValue(): Promise<number> {
    return toNumber(await this.basketTotal.innerText());
  }
}
