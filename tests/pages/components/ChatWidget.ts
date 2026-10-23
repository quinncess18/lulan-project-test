import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export type ChatMode = 'ai' | 'live';

export type LiveChatIntake = {
  name?: string;
  email?: string;
  service?: string; // option label, e.g. 'Car Rental'
};

// Floating support chat (AI Assistant + Live Chat).
// The widget is position: fixed inside Canva's full-height iframe, so its launcher sits at the
// bottom of the whole page rather than the bottom of the screen (DEFECTS.md LUL-006).
export class ChatWidget {
  private readonly page: Page;
  readonly launcher: Locator;
  readonly panel: Locator;
  readonly aiView: Locator;
  readonly aiReplies: Locator;
  readonly aiUserMessages: Locator;
  readonly disclaimer: Locator;
  readonly messageInput: Locator;
  readonly sendButton: Locator;

  // Live Chat intake
  readonly intake: Locator;
  readonly intakeName: Locator;
  readonly intakeEmail: Locator;
  readonly intakeService: Locator;
  readonly intakeError: Locator;
  readonly startButton: Locator;
  readonly liveMessages: Locator;

  constructor(base: BasePage, page: Page) {
    this.page = page;
    const widget = base.frame.locator('#chatWidget');
    this.launcher = widget.locator('#chatToggleBtn');
    this.panel = widget.locator('#chatPanel');
    this.aiView = this.panel.locator('#chatAiView');
    this.aiReplies = this.panel.locator('#chatAiMessages .chat-message.bot');
    this.aiUserMessages = this.panel.locator('#chatAiMessages .chat-message.user');
    this.disclaimer = this.panel.locator('#chatDisclaimer');
    this.messageInput = this.panel.getByLabel('Chat message');
    this.sendButton = this.panel.getByRole('button', { name: 'Send message' });

    this.intake = this.panel.locator('#chatIntake');
    this.intakeName = this.intake.getByLabel('Full name', { exact: true });
    this.intakeEmail = this.intake.getByLabel('Email', { exact: true });
    this.intakeService = this.intake.getByLabel('Service', { exact: true });
    this.intakeError = this.intake.locator('#chatIntakeError');
    this.startButton = this.intake.getByRole('button', { name: 'Start chat' });
    this.liveMessages = this.panel.locator('#chatLiveMessages');
  }

  modeTab(mode: ChatMode): Locator {
    return this.panel.locator(`[data-chat-mode="${mode}"]`);
  }

  chip(label: string): Locator {
    return this.panel.locator('.chat-chip', { hasText: label });
  }

  // True when the launcher is inside the visitor's screen (measured on the outer page)
  async launcherOnScreen(): Promise<boolean> {
    const box = await this.launcher.boundingBox();
    const viewport = this.page.viewportSize();
    if (!box || !viewport) return false;
    return box.y >= 0 && box.y + box.height <= viewport.height;
  }

  // Scroll down like a visitor until the launcher is on screen, then open the panel.
  // (The outer document doesn't scroll — Canva scrolls an inner container — so use the mouse wheel.)
  // Retry like BasePage.goToView, but only click while closed so a late handler can't close it again.
  async open() {
    const viewport = this.page.viewportSize();
    if (viewport) await this.page.mouse.move(viewport.width / 2, viewport.height / 2);
    await expect(async () => {
      await this.page.mouse.wheel(0, 2000);
      expect(await this.launcherOnScreen()).toBe(true);
    }).toPass({ timeout: 10000 });
    await expect(async () => {
      if (await this.launcher.getAttribute('aria-expanded') !== 'true') {
        await this.launcher.click();
      }
      await expect(this.launcher).toHaveAttribute('aria-expanded', 'true', { timeout: 1000 });
    }).toPass({ timeout: 10000 });
  }

  async switchTo(mode: ChatMode) {
    await this.modeTab(mode).click();
  }

  async ask(question: string) {
    await this.messageInput.fill(question);
    await this.messageInput.press('Enter');
  }

  async startLiveChat({ name, email, service }: LiveChatIntake) {
    if (name !== undefined) await this.intakeName.fill(name);
    if (email !== undefined) await this.intakeEmail.fill(email);
    if (service !== undefined) await this.intakeService.selectOption({ label: service });
    await this.startButton.click();
  }
}
