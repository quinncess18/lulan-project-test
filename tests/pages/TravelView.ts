import { Page, Locator } from '@playwright/test';
import { ViewPage } from './ViewPage';

export type TravelBooking = {
  name?: string;
  email?: string;
  packageId?: string; // option value, e.g. 'boracay'
  date?: string; // YYYY-MM-DD
  travelers?: string;
  upgrade?: boolean;
  insurance?: boolean;
};

// Turns a displayed amount like '₱34,500.00' into a number ('—' becomes 0)
const toNumber = (text: string) => Number(text.replace(/[^\d.-]/g, ''));

export class TravelView extends ViewPage {
  readonly bookingForm: Locator;
  readonly bookingLabels: Locator;
  readonly nameField: Locator;
  readonly nameInput: Locator;
  readonly emailField: Locator;
  readonly emailInput: Locator;
  readonly packageSelect: Locator;
  readonly dateField: Locator;
  readonly dateInput: Locator;
  readonly travelersInput: Locator;
  readonly upgradeCheckbox: Locator;
  readonly insuranceCheckbox: Locator;
  readonly submitButton: Locator;
  readonly bookingResult: Locator;
  readonly resultPackage: Locator;
  readonly resultPackageTotal: Locator;
  readonly resultAddons: Locator;
  readonly resultTotal: Locator;
  readonly bookingConfirmation: Locator;

  constructor(page: Page) {
    super(page, 'travel');

    this.bookingForm = this.section.locator('#travel-booking-form');
    this.bookingLabels = this.bookingForm.locator('label');
    this.nameField = this.bookingForm.locator('#travel-name-field');
    this.nameInput = this.bookingForm.getByLabel('Full name', { exact: true });
    this.emailField = this.bookingForm.locator('#travel-email-field');
    this.emailInput = this.bookingForm.getByLabel('Email', { exact: true });
    this.packageSelect = this.bookingForm.getByLabel('Package', { exact: true });
    this.dateField = this.bookingForm.locator('#travel-date-field');
    this.dateInput = this.bookingForm.getByLabel('Travel date', { exact: true });
    this.travelersInput = this.bookingForm.getByLabel('Travelers', { exact: true });
    this.upgradeCheckbox = this.bookingForm.getByLabel('Hotel upgrade');
    this.insuranceCheckbox = this.bookingForm.getByLabel('Travel insurance');
    this.submitButton = this.bookingForm.getByRole('button', { name: 'Get booking total' });
    this.bookingResult = this.bookingForm.locator('#travel-booking-result');
    this.resultPackage = this.bookingResult.locator('#travel-result-package');
    this.resultPackageTotal = this.bookingResult.locator('#travel-result-package-total');
    this.resultAddons = this.bookingResult.locator('#travel-result-addons');
    this.resultTotal = this.bookingResult.locator('#travel-result-total');
    this.bookingConfirmation = this.bookingForm.locator('#travel-booking-confirm');
  }

  // The inline validation message inside a field wrapper (e.g. emailField)
  fieldError(field: Locator): Locator {
    return field.locator('.rental-error');
  }

  async fillBooking({ name, email, packageId, date, travelers, upgrade, insurance }: TravelBooking) {
    if (name !== undefined) await this.nameInput.fill(name);
    if (email !== undefined) await this.emailInput.fill(email);
    if (packageId !== undefined) await this.packageSelect.selectOption(packageId);
    if (date !== undefined) await this.dateInput.fill(date);
    if (travelers !== undefined) await this.travelersInput.fill(travelers);
    if (upgrade !== undefined) await this.upgradeCheckbox.setChecked(upgrade);
    if (insurance !== undefined) await this.insuranceCheckbox.setChecked(insurance);
  }

  async getBookingTotal() {
    await this.submitButton.click();
  }

  // Reads the rendered breakdown as numbers so specs can check that it adds up
  async bookingBreakdown() {
    return {
      packageTotal: toNumber(await this.resultPackageTotal.innerText()),
      addons: toNumber(await this.resultAddons.innerText()),
      total: toNumber(await this.resultTotal.innerText()),
    };
  }
}
