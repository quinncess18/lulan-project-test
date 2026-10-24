import { test, expect } from '../../fixtures/visual-fixture';
import { SiteHeader, SiteFooter, ContactForm, TravelView } from '../pages';
import { showView } from './show-view';

// Runs on desktop and phone only (see playwright.config.ts) to limit snapshot count
test.describe('Visual - components and form states', () => {
  test('header', async ({ stablePage }) => {
    const base = await showView(stablePage, 'home');

    await expect(new SiteHeader(base).root).toHaveScreenshot('header.png');
  });

  test('footer', async ({ stablePage }) => {
    const base = await showView(stablePage, 'home');

    await expect(new SiteFooter(base).root).toHaveScreenshot('footer.png');
  });

  test('contact form with validation errors', async ({ stablePage }) => {
    const contact = new ContactForm(await showView(stablePage, 'home'));
    await contact.submit();
    await expect(contact.nameField).toHaveClass(/\binvalid\b/);

    await expect(contact.form).toHaveScreenshot('contact-form-errors.png');
  });

  test('travel booking form with validation errors', async ({ stablePage }) => {
    await showView(stablePage, 'travel');
    const travel = new TravelView(stablePage);
    await travel.getBookingTotal();
    await expect(travel.nameField).toHaveClass(/\binvalid\b/);

    await expect(travel.bookingForm).toHaveScreenshot('travel-form-errors.png');
  });
});
