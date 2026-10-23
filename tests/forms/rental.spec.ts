import { test, expect } from '../../fixtures/network-guard';
import { RentalView } from '../pages';
import type { VehicleFilter } from '../pages/RentalView';

// Pricing rules (from the site's script): daily rate × days (return − pickup),
// plus optional damage waiver at ₱500 per day. Pickup location does not affect the price.
const WAIVER_PER_DAY = 500;
const peso = (value: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(value);
// YYYY-MM-DD relative to today (UTC, which is what the site uses for "today")
const isoDate = (offsetDays: number, from = Date.now()) =>
  new Date(from + offsetDays * 86_400_000).toISOString().slice(0, 10);

const RENTALS = [
  { vehicleId: 'vios', name: 'Toyota Vios', rate: 2200, location: 'Manila Hub', startIn: 7, days: 1, insurance: false },
  { vehicleId: 'fortuner', name: 'Toyota Fortuner', rate: 4500, location: 'Cebu Branch', startIn: 10, days: 3, insurance: true },
  { vehicleId: 'eclass', name: 'Mercedes-Benz E-Class', rate: 9500, location: 'NAIA Terminal 3', startIn: 21, days: 6, insurance: true },
];

const FLEET: { filter: VehicleFilter; vehicles: string[] }[] = [
  { filter: 'Sedan', vehicles: ['Toyota Vios', 'Honda City'] },
  { filter: 'SUV', vehicles: ['Toyota Fortuner', 'Mitsubishi Montero'] },
  { filter: 'Van', vehicles: ['Toyota Hiace'] },
  { filter: 'Luxury', vehicles: ['Mercedes-Benz E-Class'] },
];

test.describe('Forms - Car rental calculator', () => {
  let rental: RentalView;

  test.beforeEach(async ({ page }) => {
    rental = new RentalView(page);
    await rental.navigateTo();
    await rental.open();
  });

  test('fields, labels and submit button are visible', async () => {
    await expect(rental.calculatorLabels).toHaveText([
      'Vehicle', 'Pickup location', 'Pickup date', 'Return date', /Add damage waiver insurance \(\+₱500 \/ day\)/,
    ]);
    for (const field of [rental.vehicleSelect, rental.locationSelect, rental.pickupInput, rental.returnInput,
      rental.insuranceCheckbox]) {
      await expect(field).toBeVisible();
    }
    await expect(rental.calculateButton).toBeEnabled();
    await expect(rental.result).toBeHidden();
  });

  for (const r of RENTALS) {
    test(`${r.name} for ${r.days} day(s)${r.insurance ? ' with waiver' : ''} shows the correct total`, async ({ networkGuard }) => {
      const pickup = isoDate(r.startIn);
      const returnDate = isoDate(r.startIn + r.days);
      const waiver = r.insurance ? WAIVER_PER_DAY * r.days : 0;

      await rental.fillRental({ vehicleId: r.vehicleId, location: r.location, pickup, returnDate, insurance: r.insurance });
      await rental.calculateTotal();

      await expect(rental.result).toBeVisible();
      await expect(rental.resultName).toHaveText(r.name);
      await expect(rental.resultRate).toHaveText(`${peso(r.rate)}/day`);
      await expect(rental.resultDays).toHaveText(`${r.days} day${r.days === 1 ? '' : 's'}`);
      await expect(rental.resultInsurance).toHaveText(waiver ? peso(waiver) : '—');
      await expect(rental.resultTotal).toHaveText(peso(r.rate * r.days + waiver));

      const shown = await rental.rentalBreakdown();
      expect(shown.total).toBe(shown.rate * shown.days + shown.insurance);

      networkGuard.expectNotSent(pickup, returnDate);
    });
  }

  test('empty submit marks both dates invalid and shows no total', async () => {
    await rental.calculateTotal();

    await expect(rental.pickupField).toHaveClass(/\binvalid\b/);
    await expect(rental.returnField).toHaveClass(/\binvalid\b/);
    await expect(rental.result).toBeHidden();
  });

  for (const { label, offset } of [{ label: 'before pickup', offset: -3 }, { label: 'on the pickup day', offset: 0 }]) {
    test(`return date ${label} is rejected`, async () => {
      await rental.fillRental({ pickup: isoDate(10), returnDate: isoDate(10 + offset) });
      await rental.calculateTotal();

      await expect(rental.returnField).toHaveClass(/\binvalid\b/);
      await expect(rental.pickupField).not.toHaveClass(/\binvalid\b/);
      await expect(rental.result).toBeHidden();
    });
  }

  test('pickup date in the past is rejected', async () => {
    await rental.fillRental({ pickup: isoDate(-3), returnDate: isoDate(2) });
    await rental.calculateTotal();

    await expect(rental.pickupField).toHaveClass(/\binvalid\b/);
    await expect(rental.result).toBeHidden();
  });

  // SITE BUG: the field turns red but its message never shows — the CSS only reveals
  // .rental-error with a .visible class that the script never adds.
  test('invalid fields show their validation message', { tag: ['@defect', '@LUL-004'] }, async () => {
    test.fail();
    await rental.fillRental({ pickup: isoDate(10), returnDate: isoDate(7) });
    await rental.calculateTotal();

    await expect(rental.fieldError(rental.returnField)).toBeVisible({ timeout: 2000 });
    await expect(rental.fieldError(rental.returnField)).toHaveText('Return date must be after pickup.');
  });

  // SITE BUG: an invalid re-submit leaves the previous total on screen next to the invalid field
  test('a previous total is cleared when the next submit is invalid', { tag: ['@defect', '@LUL-008'] }, async () => {
    test.fail();
    await rental.fillRental({ pickup: isoDate(10), returnDate: isoDate(12) });
    await rental.calculateTotal();
    await expect(rental.result).toBeVisible();

    await rental.fillRental({ returnDate: isoDate(8) });
    await rental.calculateTotal();

    await expect(rental.returnField).toHaveClass(/\binvalid\b/);
    await expect(rental.result).toBeHidden({ timeout: 2000 });
  });
});

test.describe('Forms - Car rental fleet filter', () => {
  let rental: RentalView;

  test.beforeEach(async ({ page }) => {
    rental = new RentalView(page);
    await rental.navigateTo();
    await rental.open();
  });

  test('each category tab shows only its vehicles, All vehicles shows the full fleet', async () => {
    await expect(rental.filterTabs).toHaveText(['All vehicles', ...FLEET.map(f => f.filter)]);
    await expect(rental.vehicleCards).toHaveCount(6);

    for (const { filter, vehicles } of FLEET) {
      await rental.filterTab(filter).click();
      await expect(rental.filterTab(filter)).toHaveAttribute('aria-selected', 'true');
      await expect(rental.vehicleCardNames).toHaveText(vehicles);
      await expect(rental.vehicleCardTypes).toHaveText(vehicles.map(() => filter));
    }

    await rental.filterTab('All vehicles').click();
    await expect(rental.vehicleCardNames).toHaveText(FLEET.flatMap(f => f.vehicles));
  });
});

test.describe('Forms - Car rental in Philippine time', () => {
  test.use({ timezoneId: 'Asia/Manila' });

  // SITE BUG: "today" is taken from toISOString() (UTC). From 00:00 to 08:00 Manila time the
  // UTC date is still yesterday, so a pickup date that has already passed locally is accepted.
  test('yesterday (Manila time) is rejected as a pickup date just after midnight', { tag: ['@defect', '@LUL-007'] }, async ({ page }) => {
    test.fail();
    // 06:00 Manila tomorrow = 22:00 UTC today, so Manila's "yesterday" is today's UTC date
    const now = new Date();
    const manilaMorning = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 22);
    await page.clock.setFixedTime(manilaMorning);

    const rental = new RentalView(page);
    await rental.navigateTo();
    await rental.open();
    await rental.fillRental({ pickup: isoDate(0, manilaMorning), returnDate: isoDate(3, manilaMorning) });
    await rental.calculateTotal();

    await expect(rental.pickupField).toHaveClass(/\binvalid\b/, { timeout: 2000 });
    await expect(rental.result).toBeHidden();
  });
});
