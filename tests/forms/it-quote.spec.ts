import { test, expect } from '../../fixtures/network-guard';
import { ItServicesView, ItCategory, ContactForm } from '../pages';

const peso = (value: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(value);

const CATALOG: Record<ItCategory, { name: string; price: number }[]> = {
  'Hardware': [
    { name: 'Business Laptop Bundle', price: 52000 },
    { name: 'Office Desktop Set', price: 38000 },
    { name: '24-Port Network Switch', price: 14500 },
    { name: 'POS Terminal', price: 26000 },
  ],
  'Software': [
    { name: 'Microsoft 365 Business', price: 6800 },
    { name: 'Endpoint Protection', price: 1200 },
    { name: 'Cloud Backup · 1TB', price: 9000 },
  ],
  'Managed Services': [
    { name: 'Help Desk Support', price: 25000 },
    { name: 'Network Setup & Cabling', price: 45000 },
    { name: 'Cybersecurity Audit', price: 60000 },
  ],
};

test.describe('Forms - IT quote basket', () => {
  let it: ItServicesView;

  test.beforeEach(async ({ page }) => {
    it = new ItServicesView(page);
    await it.navigateTo();
    await it.open();
  });

  test('basket starts empty with a zero total', async () => {
    await expect(it.basketItems).toHaveCount(0);
    await expect(it.basketEmpty).toBeVisible();
    await expect(it.basketTotal).toHaveText(peso(0));
  });

  for (const [category, products] of Object.entries(CATALOG) as [ItCategory, typeof CATALOG[ItCategory]][]) {
    test(`"${category}" tab shows only its ${products.length} products`, async () => {
      await it.selectCategory(category);

      await expect(it.categoryTab(category)).toHaveAttribute('aria-selected', 'true');
      await expect(it.visibleProductCards.getByRole('heading')).toHaveText(products.map(p => p.name));
    });
  }

  test('adding a product puts it in the basket and swaps its button for a check mark', async () => {
    const laptop = CATALOG['Hardware'][0];
    await it.addToQuote(laptop.name);

    await expect(it.basketItem(laptop.name)).toContainText(peso(laptop.price));
    await expect(it.basketTotal).toHaveText(peso(laptop.price));
    await expect(it.basketEmpty).toBeHidden();
    await expect(it.addButton(laptop.name)).toBeHidden();
    await expect(it.toast).toContainText(`${laptop.name} was added to your quote basket.`);
  });

  test('products from different tabs add up in the total', async () => {
    const picks = [CATALOG['Hardware'][1], CATALOG['Software'][2], CATALOG['Managed Services'][2]];
    for (const [category, product] of [['Hardware', picks[0]], ['Software', picks[1]], ['Managed Services', picks[2]]] as const) {
      await it.selectCategory(category);
      await it.addToQuote(product.name);
    }

    await expect(it.basketItems).toHaveCount(3);
    await expect(it.basketTotal).toHaveText(peso(picks.reduce((sum, p) => sum + p.price, 0)));
  });

  test('removing a product updates the total and brings back its "Add to quote" button', async () => {
    const [laptop, desktop] = CATALOG['Hardware'];
    await it.addToQuote(laptop.name);
    await it.addToQuote(desktop.name);
    await expect(it.basketTotal).toHaveText(peso(laptop.price + desktop.price));

    await it.removeFromQuote(laptop.name);
    await expect(it.basketItem(laptop.name)).toHaveCount(0);
    await expect(it.basketTotal).toHaveText(peso(desktop.price));
    await expect(it.addButton(laptop.name)).toBeVisible();

    await it.removeFromQuote(desktop.name);
    await expect(it.basketEmpty).toBeVisible();
    await expect(it.basketTotal).toHaveText(peso(0));
  });

  test('requesting a quote with an empty basket shows a reminder', async () => {
    await it.requestQuote();

    await expect(it.basketNote).toBeVisible();
    await expect(it.basketNote).toHaveText('Your basket is empty. Add at least one item first.');
  });

  // "Request quote" sends nothing itself: it copies the basket into the contact form (see LUL-001)
  test('requesting a quote attaches the basket to the contact form', async () => {
    const contact = new ContactForm(it);
    const [, desktop, network] = CATALOG['Hardware'];
    await it.addToQuote(desktop.name);
    await it.addToQuote(network.name);
    await it.requestQuote();

    await expect(contact.serviceSelect).toHaveValue('IT Services');
    await expect(contact.messageInput).toHaveValue([
      'IT quote request:',
      `• ${desktop.name} — ${peso(desktop.price)}`,
      `• ${network.name} — ${peso(network.price)}`,
      '',
      `Estimated total: ${peso(desktop.price + network.price)}`,
    ].join('\n'));
    await expect(contact.nameInput).toBeFocused();
    await expect(it.toast).toContainText('Your basket was attached to the inquiry form.');
  });
});
