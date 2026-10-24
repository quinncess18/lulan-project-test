import { test, expect } from '../../fixtures/network-guard';
import { HomeView, ChatWidget } from '../pages';

// The AI Assistant is a keyword matcher in the page script, checked in this order:
// "it"/"technology"/"quote" → IT, "travel"/"trip"/"tour" → travel, "car"/"rental"/"vehicle" → car,
// "logistic"/"ship"/"freight" → logistics, anything else → general.
const REPLIES = {
  it: 'Our IT team supplies hardware',
  travel: 'We can arrange Philippine trips',
  car: 'Our maintained sedans, SUVs, and vans',
  logistics: 'LULAN PH coordinates freight forwarding',
  general: 'Which service would you like to explore?',
};

const QUESTIONS = [
  { question: 'Plan a trip to Bohol', reply: REPLIES.travel },
  { question: 'I need a car rental', reply: REPLIES.car },
  { question: 'Do you ship freight to Cebu?', reply: REPLIES.logistics },
  { question: 'Do you sell technology?', reply: REPLIES.it },
  { question: 'Hello', reply: REPLIES.general },
];

test.describe('Forms - Chat widget', () => {
  let chat: ChatWidget;

  test.beforeEach(async ({ page }) => {
    const home = new HomeView(page);
    chat = new ChatWidget(home, page);
    await home.navigateTo();
  });

  test('launcher opens the panel on the AI Assistant tab', async () => {
    await chat.open();

    await expect(chat.panel).toHaveClass(/\bopen\b/);
    await expect(chat.modeTab('ai')).toHaveClass(/\bactive\b/);
    await expect(chat.aiView).toContainText('Hi! Ask me about logistics');
    await expect(chat.disclaimer).toBeVisible();
    await expect(chat.messageInput).toBeFocused();
  });

  test('a quick-question chip asks it and gets an answer', async () => {
    await chat.open();
    await chat.chip('IT quote?').click();

    await expect(chat.aiUserMessages.last()).toHaveText('How can I request an IT quote?');
    await expect(chat.aiReplies.last()).toContainText(REPLIES.it);
  });

  for (const { question, reply } of QUESTIONS) {
    test(`AI answers "${question}" with the matching service`, async ({ networkGuard }) => {
      await chat.open();
      await chat.ask(question);

      await expect(chat.aiUserMessages.last()).toHaveText(question);
      await expect(chat.aiReplies.last()).toContainText(reply);
      await expect(chat.messageInput).toHaveValue('');
      networkGuard.expectNotSent(question);
    });
  }

  test('Live Chat asks for details first and keeps the message box disabled', async () => {
    await chat.open();
    await chat.switchTo('live');

    await expect(chat.intake).toBeVisible();
    await expect(chat.messageInput).toBeDisabled();
    await expect(chat.disclaimer).toBeHidden();
  });

  for (const { name, email } of [{ name: 'A', email: 'ana@example.com' }, { name: 'Ana Cruz', email: 'not-an-email' }]) {
    test(`Live Chat rejects name "${name}" / email "${email}"`, async () => {
      await chat.open();
      await chat.switchTo('live');
      await chat.startLiveChat({ name, email });

      await expect(chat.intakeError).toBeVisible();
      await expect(chat.intakeError).toHaveText('Please enter a name and valid email.');
      await expect(chat.intake).toBeVisible();
    });
  }

  // SITE BUG: the widget is fixed inside Canva's full-height iframe, so the launcher sits at the
  // very bottom of the page (y ≈ 2635 px of 2717 on desktop) instead of the corner of the screen.
  test('chat launcher is on screen without scrolling', { tag: ['@defect', '@LUL-006'] }, async ({ page }) => {
    test.fail();
    // Measure only once Canva has grown the iframe to the full page height (it starts one screen tall)
    const iframe = new HomeView(page).iframe;
    await expect.poll(async () => (await iframe.boundingBox())?.height ?? 0).toBeGreaterThan(page.viewportSize()!.height);
    await expect(chat.launcher).toBeVisible();

    expect(await chat.launcherOnScreen()).toBe(true);
  });

  // SITE BUG: the email check in the page script is written with doubled backslashes
  // (/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/), so it requires a literal "\" and rejects any "s".
  // No normal email can start a live chat.
  test('a valid name and email start a live chat', { tag: ['@defect', '@LUL-016'] }, async () => {
    test.fail();
    await chat.open();
    await chat.switchTo('live');
    await chat.startLiveChat({ name: 'Ana Cruz', email: 'ana@example.com', service: 'Car Rental' });
    await expect(chat.intakeName).toHaveValue('Ana Cruz');

    await expect(chat.intake).toBeHidden({ timeout: 2000 });
    await expect(chat.liveMessages).toContainText('Thanks, Ana! Your Car Rental inquiry is queued.');
  });

  // SITE BUG: keywords are matched as substrings and "it" is checked first, so any word
  // containing "it" (with, visit, city…) gets the IT answer.
  test('a travel question that contains "with" gets the travel answer', { tag: ['@defect', '@LUL-017'] }, async () => {
    test.fail();
    await chat.open();
    await chat.ask('Can I visit Boracay with my family?');
    await expect(chat.aiReplies.last()).toBeVisible();

    await expect(chat.aiReplies.last()).toContainText(REPLIES.travel, { timeout: 2000 });
  });
});
