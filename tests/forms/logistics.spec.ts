import { test, expect } from '../../fixtures/network-guard';
import { LogisticsView } from '../pages';

// Pricing rules (from the site's script): total = (₱250 base + weight × service rate) × destination multiplier
const BASE_FEE = 250;
const peso = (value: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(value);

const QUOTES = [
  { destination: 'Cebu — Visayas', multiplier: 1.8, service: 'Standard (3–5 days)', rate: 45, weight: '13.5' },
  { destination: 'Quezon City — Metro Manila', multiplier: 1, service: 'Express (1–2 days)', rate: 75, weight: '418.5' },
  { destination: 'Davao — Mindanao', multiplier: 2.2, service: 'Same-day', rate: 120, weight: '27.5' },
];

test.describe('Forms - Logistics freight estimate', () => {
  let logistics: LogisticsView;

  test.beforeEach(async ({ page }) => {
    logistics = new LogisticsView(page);
    await logistics.navigateTo();
    await logistics.open();
  });

  test('fields, labels and submit button are visible', async () => {
    await expect(logistics.quoteLabels).toHaveText(['Destination', 'Weight (kg)', 'Service level']);
    await expect(logistics.destinationSelect).toBeVisible();
    await expect(logistics.weightInput).toBeVisible();
    await expect(logistics.serviceSelect).toBeVisible();
    await expect(logistics.calculateButton).toBeEnabled();
    await expect(logistics.quoteResult).toBeHidden();
  });

  for (const q of QUOTES) {
    test(`${q.weight} kg to ${q.destination} by ${q.service} shows the correct estimate`, async ({ networkGuard }) => {
      const weightCharge = Number(q.weight) * q.rate;

      await logistics.fillQuote({ destination: q.destination, weight: q.weight, service: q.service });
      await logistics.calculateEstimate();

      await expect(logistics.quoteResult).toBeVisible();
      await expect(logistics.baseFee).toHaveText(peso(BASE_FEE));
      await expect(logistics.weightCharge).toHaveText(peso(weightCharge));
      await expect(logistics.multiplier).toHaveText(`×${q.multiplier.toFixed(2)}`);
      await expect(logistics.total).toHaveText(peso((BASE_FEE + weightCharge) * q.multiplier));

      // The breakdown shown to the user adds up to the total shown
      const shown = await logistics.quoteBreakdown();
      expect(shown.total).toBeCloseTo((shown.base + shown.weightCharge) * shown.multiplier, 2);

      networkGuard.expectNotSent(q.weight);
    });
  }

  test('empty submit marks destination and weight invalid and shows no estimate', async () => {
    await logistics.calculateEstimate();

    await expect(logistics.destinationField).toHaveClass(/\binvalid\b/);
    await expect(logistics.weightField).toHaveClass(/\binvalid\b/);
    await expect(logistics.quoteResult).toBeHidden();
  });

  for (const weight of ['0', '-5']) {
    test(`weight ${weight} is rejected`, async () => {
      await logistics.fillQuote({ destination: 'Baguio — Luzon', weight });
      await logistics.calculateEstimate();

      await expect(logistics.weightField).toHaveClass(/\binvalid\b/);
      await expect(logistics.destinationField).not.toHaveClass(/\binvalid\b/);
      await expect(logistics.quoteResult).toBeHidden();
    });
  }

  // SITE BUG: the field turns red but its message ("Enter a weight greater than 0.") never shows —
  // the CSS only reveals .logistics-error with a .visible class that the script never adds.
  // An invalid <select> gets no red border either, so a missing destination has no visible cue at all.
  test('invalid fields show their validation message', { tag: ['@defect', '@LUL-004'] }, async () => {
    test.fail();
    await logistics.calculateEstimate();

    await expect(logistics.fieldError(logistics.weightField)).toBeVisible({ timeout: 2000 });
    await expect(logistics.fieldError(logistics.weightField)).toHaveText('Enter a weight greater than 0.');
    await expect(logistics.fieldError(logistics.destinationField)).toBeVisible();
    await expect(logistics.fieldError(logistics.destinationField)).toHaveText('Choose a destination.');
  });

  // SITE BUG: an invalid re-submit leaves the previous estimate on screen next to the invalid field
  test('a previous estimate is cleared when the next submit is invalid', { tag: ['@defect', '@LUL-008'] }, async () => {
    test.fail();
    await logistics.fillQuote({ destination: 'Cebu — Visayas', weight: '10' });
    await logistics.calculateEstimate();
    await expect(logistics.quoteResult).toBeVisible();

    await logistics.fillQuote({ weight: '-5' });
    await logistics.calculateEstimate();

    await expect(logistics.weightField).toHaveClass(/\binvalid\b/);
    await expect(logistics.quoteResult).toBeHidden({ timeout: 2000 });
  });
});

test.describe('Forms - Logistics shipment tracker', () => {
  let logistics: LogisticsView;

  test.beforeEach(async ({ page }) => {
    logistics = new LogisticsView(page);
    await logistics.navigateTo();
    await logistics.open();
  });

  test('tracking field, label and submit button are visible', async () => {
    await expect(logistics.trackingInput).toBeVisible();
    await expect(logistics.trackButton).toBeEnabled();
    await expect(logistics.trackerResult).toBeHidden();
  });

  // TEST NOTE: there is no shipment database — any number of 3+ characters gets a made-up
  // status derived from a hash of the text, so "unknown" numbers are tracked like real ones.
  test('a tracking number shows the five-stage timeline, the same each time', async ({ networkGuard }) => {
    const trackingNumber = 'LULAN-QA-7731';

    await logistics.track(trackingNumber);
    await expect(logistics.trackerResult).toBeVisible();
    await expect(logistics.trackerSteps).toHaveText([
      /Manifest created/, /Picked up/, /In transit/, /Out for delivery/, /Delivered/,
    ]);
    const reached = await logistics.reachedTrackerSteps.count();
    expect(reached).toBeGreaterThanOrEqual(1);

    await logistics.track(trackingNumber);
    await expect(logistics.reachedTrackerSteps).toHaveCount(reached);

    networkGuard.expectNotSent(trackingNumber);
  });

  for (const trackingNumber of ['', '  ', 'AB']) {
    test(`tracking number ${JSON.stringify(trackingNumber)} is rejected`, async () => {
      await logistics.track(trackingNumber);

      await expect(logistics.trackingField).toHaveClass(/\binvalid\b/);
      await expect(logistics.trackerResult).toBeHidden();
    });
  }
});
