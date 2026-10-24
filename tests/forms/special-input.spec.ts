import { test, expect } from '../../fixtures/network-guard';
import { HomeView, ContactForm, ChatWidget } from '../pages';

// Nothing is sent to a server, so these only check the page itself: long and non-ASCII
// input is accepted, and HTML typed by a visitor is shown as text, never run as markup.
const HTML_PAYLOAD = '<img src="x" id="lulan-qa-xss" onerror="alert(\'xss\')">';
const UNICODE_NAME = 'Ñiño José Dela Cruz-Ångström 🚚';

test.describe('Forms - Special characters and long input', () => {
  let home: HomeView;
  let dialogs: string[];

  test.beforeEach(async ({ page }) => {
    dialogs = [];
    page.on('dialog', async (dialog) => {
      dialogs.push(dialog.message());
      await dialog.dismiss();
    });
    home = new HomeView(page);
    await home.navigateTo();
  });

  test('contact form accepts accented names, emoji and a 5,000-character message', async () => {
    const contact = new ContactForm(home);
    const message = 'LULAN-QA long message. '.repeat(220).slice(0, 5000);

    await contact.fill({ name: UNICODE_NAME, email: 'nino.qa@example.com', message });
    await expect(contact.messageInput).toHaveValue(message); // no max length cuts it short
    await contact.submit();

    await expect(contact.nameField).not.toHaveClass(/\binvalid\b/);
    await expect(contact.result).toContainText('Your inquiry is ready.');
  });

  test('HTML typed into the contact form is not run as markup', async () => {
    const contact = new ContactForm(home);

    await contact.fill({ name: HTML_PAYLOAD, email: 'xss.qa@example.com', message: HTML_PAYLOAD });
    await contact.submit();

    await expect(contact.result).toBeVisible();
    await expect(home.frame.locator('#lulan-qa-xss')).toHaveCount(0);
    expect(dialogs).toEqual([]);
  });

  test('HTML typed into the AI chat is shown as plain text', async ({ page }) => {
    const chat = new ChatWidget(home, page);
    await chat.open();

    await chat.ask(HTML_PAYLOAD);

    await expect(chat.aiUserMessages.last()).toHaveText(HTML_PAYLOAD);
    await expect(home.frame.locator('#lulan-qa-xss')).toHaveCount(0);
    expect(dialogs).toEqual([]);
  });
});
