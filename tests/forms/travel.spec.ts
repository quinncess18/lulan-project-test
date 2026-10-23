import { test, expect } from '../../fixtures/network-guard';
import { TravelView } from '../pages';

// Pricing rules (from the site's script): package price × travelers,
// plus per-traveler add-ons: hotel upgrade ₱3,500, travel insurance ₱850
const UPGRADE = 3500;
const INSURANCE = 850;
const peso = (value: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(value);
// YYYY-MM-DD relative to today (UTC, which is what the site uses for "today")
const isoDate = (offsetDays: number, from = Date.now()) =>
  new Date(from + offsetDays * 86_400_000).toISOString().slice(0, 10);

const TRAVELER = { name: 'Ana Testcase Cruz', email: 'ana.lulan-qa@example.com' };

const BOOKINGS = [
  { packageId: 'elnido', name: 'El Nido, Palawan', price: 18500, travelers: 1, upgrade: false, insurance: false },
  { packageId: 'boracay', name: 'Boracay', price: 12900, travelers: 2, upgrade: true, insurance: true },
  { packageId: 'batanes', name: 'Batanes', price: 26800, travelers: 3, upgrade: false, insurance: true },
];

test.describe('Forms - Travel booking', () => {
  let travel: TravelView;

  test.beforeEach(async ({ page }) => {
    travel = new TravelView(page);
    await travel.navigateTo();
    await travel.open();
  });

  test('fields, labels and submit button are visible', async () => {
    await expect(travel.bookingLabels).toHaveText([
      'Full name', 'Email', 'Package', 'Travel date', 'Travelers',
      /Hotel upgrade \(\+₱3,500 \/ person\)/, /Travel insurance \(\+₱850 \/ person\)/,
    ]);
    for (const field of [travel.nameInput, travel.emailInput, travel.packageSelect, travel.dateInput,
      travel.travelersInput, travel.upgradeCheckbox, travel.insuranceCheckbox]) {
      await expect(field).toBeVisible();
    }
    await expect(travel.submitButton).toBeEnabled();
    await expect(travel.bookingResult).toBeHidden();
  });

  for (const b of BOOKINGS) {
    const addonsLabel = [b.upgrade && 'upgrade', b.insurance && 'insurance'].filter(Boolean).join(' + ') || 'no add-ons';
    test(`${b.name} for ${b.travelers} with ${addonsLabel} shows the correct total`, async ({ networkGuard }) => {
      const packageTotal = b.price * b.travelers;
      const addons = ((b.upgrade ? UPGRADE : 0) + (b.insurance ? INSURANCE : 0)) * b.travelers;
      const date = isoDate(14);

      await travel.fillBooking({ ...TRAVELER, packageId: b.packageId, date, travelers: String(b.travelers),
        upgrade: b.upgrade, insurance: b.insurance });
      await travel.getBookingTotal();

      await expect(travel.bookingResult).toBeVisible();
      await expect(travel.resultPackage).toHaveText(`${b.name} × ${b.travelers}`);
      await expect(travel.resultPackageTotal).toHaveText(peso(packageTotal));
      await expect(travel.resultAddons).toHaveText(addons ? peso(addons) : '—');
      await expect(travel.resultTotal).toHaveText(peso(packageTotal + addons));

      const shown = await travel.bookingBreakdown();
      expect(shown.total).toBe(shown.packageTotal + shown.addons);

      networkGuard.expectNotSent(TRAVELER.name, TRAVELER.email, date);
    });
  }

  test('empty submit marks name, email and date invalid and shows no total', async () => {
    await travel.getBookingTotal();

    await expect(travel.nameField).toHaveClass(/\binvalid\b/);
    await expect(travel.emailField).toHaveClass(/\binvalid\b/);
    await expect(travel.dateField).toHaveClass(/\binvalid\b/);
    await expect(travel.bookingResult).toBeHidden();
    await expect(travel.bookingConfirmation).toBeHidden();
  });

  for (const email of ['ana@example', 'ana.example.com', 'ana @example.com']) {
    test(`email "${email}" is rejected`, async () => {
      await travel.fillBooking({ name: TRAVELER.name, email, date: isoDate(14) });
      await travel.getBookingTotal();

      await expect(travel.emailField).toHaveClass(/\binvalid\b/);
      await expect(travel.nameField).not.toHaveClass(/\binvalid\b/);
      await expect(travel.bookingResult).toBeHidden();
    });
  }

  test('a one-letter name and a past travel date are rejected', async () => {
    await travel.fillBooking({ name: 'A', email: TRAVELER.email, date: isoDate(-3) });
    await travel.getBookingTotal();

    await expect(travel.nameField).toHaveClass(/\binvalid\b/);
    await expect(travel.dateField).toHaveClass(/\binvalid\b/);
    await expect(travel.emailField).not.toHaveClass(/\binvalid\b/);
    await expect(travel.bookingResult).toBeHidden();
  });

  // TEST NOTE: 0 (or negative) travelers is not flagged — the script silently prices it as 1 traveler
  test('0 travelers is priced as 1 traveler', async () => {
    await travel.fillBooking({ ...TRAVELER, packageId: 'baguio', date: isoDate(14), travelers: '0' });
    await travel.getBookingTotal();

    await expect(travel.resultPackage).toHaveText('Baguio × 1');
    await expect(travel.resultTotal).toHaveText(peso(6500));
  });

  // SITE BUG: the field turns red but its message never shows — the CSS only reveals
  // .rental-error with a .visible class that the script never adds.
  test('invalid fields show their validation message', { tag: ['@defect', '@LUL-004'] }, async () => {
    test.fail();
    await travel.getBookingTotal();

    await expect(travel.fieldError(travel.nameField)).toBeVisible({ timeout: 2000 });
    await expect(travel.fieldError(travel.nameField)).toHaveText('Please enter your name.');
    await expect(travel.fieldError(travel.emailField)).toHaveText('Enter a valid email address.');
    await expect(travel.fieldError(travel.dateField)).toHaveText('Choose a date from today onward.');
  });

  // SITE BUG: "Booking request received ... will send payment instructions by email" is shown,
  // but the form is client-side only — nothing is sent, so no one will ever follow up.
  test('does not claim a booking was received when nothing was sent', { tag: ['@defect', '@LUL-002'] }, async ({ networkGuard }) => {
    test.fail();
    await travel.fillBooking({ ...TRAVELER, packageId: 'bohol', date: isoDate(14) });
    await travel.getBookingTotal();
    await expect(travel.bookingResult).toBeVisible();
    networkGuard.expectNotSent(TRAVELER.email);

    await expect(travel.bookingConfirmation).toBeHidden({ timeout: 2000 });
  });

  // SITE BUG: an invalid re-submit leaves the previous total and confirmation on screen
  test('a previous total is cleared when the next submit is invalid', { tag: ['@defect', '@LUL-008'] }, async () => {
    test.fail();
    await travel.fillBooking({ ...TRAVELER, packageId: 'bohol', date: isoDate(14) });
    await travel.getBookingTotal();
    await expect(travel.bookingResult).toBeVisible();

    await travel.fillBooking({ email: 'not-an-email' });
    await travel.getBookingTotal();

    await expect(travel.emailField).toHaveClass(/\binvalid\b/);
    await expect(travel.bookingResult).toBeHidden({ timeout: 2000 });
  });
});

test.describe('Forms - Travel booking in Philippine time', () => {
  test.use({ timezoneId: 'Asia/Manila' });

  // SITE BUG: "today" is taken from toISOString() (UTC). From 00:00 to 08:00 Manila time the
  // UTC date is still yesterday, so a date that has already passed locally is accepted.
  test('yesterday (Manila time) is rejected just after midnight', { tag: ['@defect', '@LUL-007'] }, async ({ page }) => {
    test.fail();
    // 06:00 Manila tomorrow = 22:00 UTC today, so Manila's "yesterday" is today's UTC date
    const now = new Date();
    const manilaMorning = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 22);
    await page.clock.setFixedTime(manilaMorning);

    const travel = new TravelView(page);
    await travel.navigateTo();
    await travel.open();
    await travel.fillBooking({ ...TRAVELER, date: isoDate(0, manilaMorning) });
    await travel.getBookingTotal();

    await expect(travel.dateField).toHaveClass(/\binvalid\b/, { timeout: 2000 });
    await expect(travel.bookingResult).toBeHidden();
  });
});
