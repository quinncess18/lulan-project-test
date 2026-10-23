import { Locator } from '@playwright/test';
import { BasePage } from '../BasePage';

export type ContactInquiry = {
  name?: string;
  email?: string;
  service?: string; // option label, e.g. 'Car Rental'
  message?: string;
};

// Contact section below every view (inside the Canva iframe, outside the page-view sections)
export class ContactForm {
  readonly root: Locator;
  readonly form: Locator;
  readonly labels: Locator;
  readonly nameField: Locator;
  readonly nameInput: Locator;
  readonly emailField: Locator;
  readonly emailInput: Locator;
  readonly serviceSelect: Locator;
  readonly messageField: Locator;
  readonly messageInput: Locator;
  readonly submitButton: Locator;
  readonly result: Locator;

  constructor(base: BasePage) {
    this.root = base.frame.locator('#contact');
    this.form = this.root.locator('#contact-form');
    this.labels = this.form.locator('label');
    this.nameField = this.form.locator('#contact-name-field');
    this.nameInput = this.form.getByLabel('Full name', { exact: true });
    this.emailField = this.form.locator('#contact-email-field');
    this.emailInput = this.form.getByLabel('Email', { exact: true });
    this.serviceSelect = this.form.getByLabel('Service of interest', { exact: true });
    this.messageField = this.form.locator('#contact-message-field');
    this.messageInput = this.form.getByLabel('Message', { exact: true });
    this.submitButton = this.form.getByRole('button', { name: 'Send inquiry' });
    this.result = this.root.locator('#contact-result');
  }

  // The inline validation message inside a field wrapper (e.g. emailField)
  fieldError(field: Locator): Locator {
    return field.locator('.error');
  }

  async fill({ name, email, service, message }: ContactInquiry) {
    if (name !== undefined) await this.nameInput.fill(name);
    if (email !== undefined) await this.emailInput.fill(email);
    if (service !== undefined) await this.serviceSelect.selectOption({ label: service });
    if (message !== undefined) await this.messageInput.fill(message);
  }

  async submit() {
    await this.submitButton.click();
  }
}
