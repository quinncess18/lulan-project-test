import { Page, Locator } from '@playwright/test';
import { ViewPage } from './ViewPage';

export type RentalRequest = {
  vehicleId?: string; // option value, e.g. 'fortuner'
  location?: string; // option label, e.g. 'Cebu Branch'
  pickup?: string; // YYYY-MM-DD
  returnDate?: string; // YYYY-MM-DD
  insurance?: boolean;
};

export type VehicleFilter = 'All vehicles' | 'Sedan' | 'SUV' | 'Van' | 'Luxury';

// Turns a displayed amount like '₱15,000.00' or '3 days' into a number ('—' becomes 0)
const toNumber = (text: string) => Number(text.replace(/[^\d.-]/g, ''));

export class RentalView extends ViewPage {
  // Fleet grid with category filter tabs
  readonly filterTabs: Locator;
  readonly vehicleCards: Locator;
  readonly vehicleCardNames: Locator;
  readonly vehicleCardTypes: Locator;

  // Rental calculator form
  readonly calculatorForm: Locator;
  readonly calculatorLabels: Locator;
  readonly vehicleSelect: Locator;
  readonly locationSelect: Locator;
  readonly pickupField: Locator;
  readonly pickupInput: Locator;
  readonly returnField: Locator;
  readonly returnInput: Locator;
  readonly insuranceCheckbox: Locator;
  readonly calculateButton: Locator;
  readonly result: Locator;
  readonly resultName: Locator;
  readonly resultRate: Locator;
  readonly resultDays: Locator;
  readonly resultInsurance: Locator;
  readonly resultTotal: Locator;

  constructor(page: Page) {
    super(page, 'rental');

    this.filterTabs = this.section.locator('#rental-filter-tabs').getByRole('tab');
    this.vehicleCards = this.section.locator('#rental-fleet-grid .rental-vehicle-card');
    this.vehicleCardNames = this.vehicleCards.locator('h3');
    this.vehicleCardTypes = this.vehicleCards.locator('.vehicle-type');

    this.calculatorForm = this.section.locator('#rental-calculator');
    this.calculatorLabels = this.calculatorForm.locator('label');
    this.vehicleSelect = this.calculatorForm.getByLabel('Vehicle', { exact: true });
    this.locationSelect = this.calculatorForm.getByLabel('Pickup location', { exact: true });
    this.pickupField = this.calculatorForm.locator('#rental-pickup-field');
    this.pickupInput = this.calculatorForm.getByLabel('Pickup date', { exact: true });
    this.returnField = this.calculatorForm.locator('#rental-return-field');
    this.returnInput = this.calculatorForm.getByLabel('Return date', { exact: true });
    this.insuranceCheckbox = this.calculatorForm.getByLabel('Add damage waiver insurance');
    this.calculateButton = this.calculatorForm.getByRole('button', { name: 'Calculate rental total' });
    this.result = this.calculatorForm.locator('#rental-result');
    this.resultName = this.result.locator('#rental-result-name');
    this.resultRate = this.result.locator('#rental-result-rate');
    this.resultDays = this.result.locator('#rental-result-days');
    this.resultInsurance = this.result.locator('#rental-result-insurance');
    this.resultTotal = this.result.locator('#rental-result-total');
  }

  filterTab(name: VehicleFilter): Locator {
    return this.section.locator('#rental-filter-tabs').getByRole('tab', { name, exact: true });
  }

  // The inline validation message inside a field wrapper (e.g. returnField)
  fieldError(field: Locator): Locator {
    return field.locator('.rental-error');
  }

  async fillRental({ vehicleId, location, pickup, returnDate, insurance }: RentalRequest) {
    if (vehicleId !== undefined) await this.vehicleSelect.selectOption(vehicleId);
    if (location !== undefined) await this.locationSelect.selectOption({ label: location });
    if (pickup !== undefined) await this.pickupInput.fill(pickup);
    if (returnDate !== undefined) await this.returnInput.fill(returnDate);
    if (insurance !== undefined) await this.insuranceCheckbox.setChecked(insurance);
  }

  async calculateTotal() {
    await this.calculateButton.click();
  }

  // Reads the rendered breakdown as numbers so specs can check that it adds up
  async rentalBreakdown() {
    return {
      rate: toNumber(await this.resultRate.innerText()),
      days: toNumber(await this.resultDays.innerText()),
      insurance: toNumber(await this.resultInsurance.innerText()),
      total: toNumber(await this.resultTotal.innerText()),
    };
  }
}
