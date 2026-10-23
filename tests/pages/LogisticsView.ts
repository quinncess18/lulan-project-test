import { Page, Locator } from '@playwright/test';
import { ViewPage } from './ViewPage';

export type LogisticsQuote = {
  destination?: string; // option label, e.g. 'Cebu — Visayas'
  weight?: string;
  service?: string; // option label, e.g. 'Express (1–2 days)'
};

// Turns a displayed amount like '₱1,260.00' or '×1.80' into a number
const toNumber = (text: string) => Number(text.replace(/[^\d.-]/g, ''));

export class LogisticsView extends ViewPage {
  // Freight estimate form
  readonly quoteForm: Locator;
  readonly quoteLabels: Locator;
  readonly destinationField: Locator;
  readonly destinationSelect: Locator;
  readonly weightField: Locator;
  readonly weightInput: Locator;
  readonly serviceSelect: Locator;
  readonly calculateButton: Locator;
  readonly quoteResult: Locator;
  readonly baseFee: Locator;
  readonly weightCharge: Locator;
  readonly multiplier: Locator;
  readonly total: Locator;

  // Shipment tracker form
  readonly trackerForm: Locator;
  readonly trackingField: Locator;
  readonly trackingInput: Locator;
  readonly trackButton: Locator;
  readonly trackerResult: Locator;
  readonly trackerSteps: Locator;
  readonly reachedTrackerSteps: Locator;

  constructor(page: Page) {
    super(page, 'logistics');

    this.quoteForm = this.section.locator('#logistics-quote-form');
    this.quoteLabels = this.quoteForm.locator('label');
    this.destinationField = this.quoteForm.locator('#logistics-destination-field');
    this.destinationSelect = this.quoteForm.getByLabel('Destination', { exact: true });
    this.weightField = this.quoteForm.locator('#logistics-weight-field');
    this.weightInput = this.quoteForm.getByLabel('Weight (kg)', { exact: true });
    this.serviceSelect = this.quoteForm.getByLabel('Service level', { exact: true });
    this.calculateButton = this.quoteForm.getByRole('button', { name: 'Calculate estimate' });
    this.quoteResult = this.quoteForm.locator('#logistics-quote-result');
    this.baseFee = this.quoteResult.locator('#logistics-base');
    this.weightCharge = this.quoteResult.locator('#logistics-weight-charge');
    this.multiplier = this.quoteResult.locator('#logistics-multiplier');
    this.total = this.quoteResult.locator('#logistics-total');

    this.trackerForm = this.section.locator('#logistics-tracker-form');
    this.trackingField = this.trackerForm.locator('#logistics-tracking-field');
    this.trackingInput = this.trackerForm.getByLabel('Tracking number', { exact: true });
    this.trackButton = this.trackerForm.getByRole('button', { name: 'Track shipment' });
    this.trackerResult = this.section.locator('#logistics-tracker-result');
    this.trackerSteps = this.trackerResult.locator('#logistics-tracker-steps .shipment-step');
    this.reachedTrackerSteps = this.trackerSteps.filter({ has: this.frame.locator('.shipment-dot.filled') });
  }

  // The inline validation message inside a field wrapper (e.g. weightField)
  fieldError(field: Locator): Locator {
    return field.locator('.logistics-error');
  }

  async fillQuote({ destination, weight, service }: LogisticsQuote) {
    if (destination !== undefined) await this.destinationSelect.selectOption({ label: destination });
    if (weight !== undefined) await this.weightInput.fill(weight);
    if (service !== undefined) await this.serviceSelect.selectOption({ label: service });
  }

  async calculateEstimate() {
    await this.calculateButton.click();
  }

  // Reads the rendered breakdown as numbers so specs can check that it adds up
  async quoteBreakdown() {
    return {
      base: toNumber(await this.baseFee.innerText()),
      weightCharge: toNumber(await this.weightCharge.innerText()),
      multiplier: toNumber(await this.multiplier.innerText()),
      total: toNumber(await this.total.innerText()),
    };
  }

  async track(trackingNumber: string) {
    await this.trackingInput.fill(trackingNumber);
    await this.trackButton.click();
  }
}
