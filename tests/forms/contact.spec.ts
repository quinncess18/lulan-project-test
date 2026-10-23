import { test, expect } from '../../fixtures/network-guard';
import { HomeView, ContactForm, SiteHeader } from '../pages';

// Validation rules (from the site's script): name ≥ 2 characters, email like x@y.z,
// message ≥ 8 characters. Service always has a value. A valid submit resets the form.
const INQUIRY = {
  name: 'Ana Testcase Cruz',
  email: 'ana.lulan-qa@example.com',
  service: 'Car Rental',
  message: 'LULAN-QA-4410 need an SUV for 3 days',
};

test.describe('Forms - Contact inquiry', () => {
  let home: HomeView;
  let contact: ContactForm;

  test.beforeEach(async ({ page }) => {
    home = new HomeView(page);
    contact = new ContactForm(home);
    await home.navigateTo();
  });

  test('fields, labels and submit button are visible', async () => {
    await expect(contact.labels).toHaveText(['Full name', 'Email', 'Service of interest', 'Message']);
    for (const field of [contact.nameInput, contact.emailInput, contact.serviceSelect, contact.messageInput]) {
      await expect(field).toBeVisible();
    }
    await expect(contact.serviceSelect).toHaveValue('General inquiry');
    await expect(contact.submitButton).toBeEnabled();
    await expect(contact.result).toBeHidden();
  });

  test('a valid inquiry shows the confirmation and resets the form', async ({ networkGuard }) => {
    await contact.fill(INQUIRY);
    await contact.submit();

    await expect(contact.result).toBeVisible();
    await expect(contact.result).toContainText('Your inquiry is ready.');
    await expect(contact.nameInput).toHaveValue('');
    await expect(contact.emailInput).toHaveValue('');
    await expect(contact.messageInput).toHaveValue('');
    await expect(contact.serviceSelect).toHaveValue('General inquiry');

    networkGuard.expectNotSent(INQUIRY.name, INQUIRY.email, 'LULAN-QA-4410');
  });

  test('empty submit shows a message under each required field', async () => {
    await contact.submit();

    await expect(contact.fieldError(contact.nameField)).toHaveText('Enter your name.');
    await expect(contact.fieldError(contact.emailField)).toHaveText('Enter a valid email.');
    await expect(contact.fieldError(contact.messageField)).toHaveText('Add a short message.');
    await expect(contact.nameInput).toBeFocused();
    await expect(contact.result).toBeHidden();
  });

  for (const email of ['ana@example', 'ana.example.com', 'ana @example.com']) {
    test(`email "${email}" is rejected`, async () => {
      await contact.fill({ ...INQUIRY, email });
      await contact.submit();

      await expect(contact.emailField).toHaveClass(/\binvalid\b/);
      await expect(contact.fieldError(contact.emailField)).toBeVisible();
      await expect(contact.nameField).not.toHaveClass(/\binvalid\b/);
      await expect(contact.result).toBeHidden();
    });
  }

  test('a one-letter name and a message under 8 characters are rejected', async () => {
    await contact.fill({ ...INQUIRY, name: 'A', message: 'Hello!' });
    await contact.submit();

    await expect(contact.nameField).toHaveClass(/\binvalid\b/);
    await expect(contact.messageField).toHaveClass(/\binvalid\b/);
    await expect(contact.emailField).not.toHaveClass(/\binvalid\b/);
    await expect(contact.result).toBeHidden();
  });

  test('a previous confirmation is cleared when the next submit is invalid', async () => {
    await contact.fill(INQUIRY);
    await contact.submit();
    await expect(contact.result).toBeVisible();

    await contact.submit(); // form was reset, so this submit is empty

    await expect(contact.nameField).toHaveClass(/\binvalid\b/);
    await expect(contact.result).toBeHidden();
  });

  test('"Get a quote" in the header jumps to the form and focuses the name field', async () => {
    await home.goToView('logistics');
    await new SiteHeader(home).quoteButton.click();

    await expect(contact.nameInput).toBeFocused();
  });

  // SITE BUG: the confirmation promises a coordinator will follow up, but the form is
  // client-side only — nothing is sent, so the inquiry is lost.
  test('does not promise a follow-up when nothing was sent', { tag: ['@defect', '@LUL-001'] }, async ({ networkGuard }) => {
    test.fail();
    await contact.fill(INQUIRY);
    await contact.submit();
    await expect(contact.nameField).not.toHaveClass(/\binvalid\b/);
    networkGuard.expectNotSent(INQUIRY.email);

    await expect(contact.result).not.toContainText('will follow up', { timeout: 2000 });
  });
});
