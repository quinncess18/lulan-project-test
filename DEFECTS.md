# Defect Log — lulan.com.ph

Defects found while building the automated test suite. The site isn't open to customers yet, so **severity assumes the site goes live as it is today**.

**Severity**
- **High:** a customer would lose something or be misled (lost inquiry, lost booking)
- **Medium:** a feature doesn't work as shown, or customers get confused
- **Low:** cosmetic, minor, or a code-quality/performance issue

**Status:** all entries are `Open` unless marked otherwise.

**About the tests:** where a test exists for a defect, it's marked `test.fail()` and is expected to fail today. When the defect is fixed, that test will report *"expected to fail, but passed"*. Remove the `test.fail()` line then, and it becomes a normal regression test.

Each of those tests is tagged `@defect` plus its ID:
- `npx playwright test --grep @defect` runs all known-defect tests (are they still open?)
- `npx playwright test --grep @LUL-004` re-checks one defect after a fix
- In the terminal an open defect shows as ✘ but counts as **passed** (it failed as expected)

---

## Summary

| ID | Title | Area | Severity | Covered by test |
|---|---|---|---|---|
| LUL-001 | Contact form promises a follow-up but sends nothing | Contact | **High** | Not yet |
| LUL-002 | Travel form says "Booking request received" but sends nothing | Travel | **High** | Yes |
| LUL-003 | "Request quote" in the IT basket sends nothing | IT Services | Medium | Not yet |
| LUL-004 | Validation messages never appear on the calculator forms | Logistics, Travel, Rental | Medium | Yes |
| LUL-005 | Shipment tracker shows a made-up status for any number | Logistics | Medium | Yes (pins behavior) |
| LUL-006 | Chat button is hidden at the very bottom of the page | Chat | Medium | Not yet |
| LUL-007 | "Today" uses UTC: past dates accepted from 00:00 to 08:00 Manila time | Travel, Rental | Medium | Yes |
| LUL-008 | Old totals stay on screen after an invalid re-submit | Logistics, Travel, Rental | Low | Yes |
| LUL-009 | Site sometimes takes over 10 seconds to appear (blank page) | Whole site | Low | Indirectly |
| LUL-010 | Nav clicks are ignored for a moment after the page appears | Navigation | Low | Indirectly |
| LUL-011 | 0 or negative travelers is silently priced as 1 traveler | Travel | Low | Yes (pins behavior) |
| LUL-012 | Weight field allows 0.5 kg although its minimum is 1 | Logistics | Low | No |
| LUL-013 | Two icons don't render ("layers-3", "route") | Whole site | Low | No |
| LUL-014 | Tailwind is loaded from its development CDN | Whole site | Low | No |
| LUL-015 | "Get a quote" button is missing on phones | Mobile | Low (question) | No |

---

## Details

### LUL-001: Contact form promises a follow-up but sends nothing
- **Severity:** High
- **Steps:** fill in the contact form (name, email, service, message) and click **Send inquiry**.
- **Expected:** the inquiry reaches LULAN PH (an email, CRM, or form service).
- **Actual:** the page shows *"Your inquiry is ready. Thank you. A LULAN PH coordinator will follow up using the email you provided."*, but **no network request is made**. The message is lost.
- **Evidence:** one-time recon on 2026-10-22, with every network request watched during the submit.
- **Suggested fix:** connect the form to a submission service, or change the message until one is connected.

### LUL-002: Travel form says "Booking request received" but sends nothing
- **Severity:** High
- **Steps:** Travel & Tours → fill in the booking form → **Get booking total**.
- **Expected:** a booking request reaches the travel desk, or the page only shows an estimate.
- **Actual:** the page shows *"Booking request received. Our travel desk will confirm availability and send payment instructions by email within 24 hours."* Nothing is sent.
- **Test:** `tests/forms/travel.spec.ts` → "does not claim a booking was received when nothing was sent"

### LUL-003: "Request quote" in the IT basket sends nothing
- **Severity:** Medium (needs an owner decision)
- **Steps:** IT Services → **Add to quote** on any item → **Request quote**.
- **Actual:** the basket shows an estimated total (*"Build a planning estimate for this session"*). No request is sent.
- **Note:** if this is meant to be an estimate only, rename the button (e.g. "Show estimate"). If it's meant to request a quote, connect it like LUL-001.
- **Evidence:** recon on 2026-10-22.

### LUL-004: Validation messages never appear on the calculator forms
- **Severity:** Medium
- **Where:** freight estimate (Logistics), booking form (Travel), rental calculator (Car Rental).
- **Steps:** submit any of these forms empty or with invalid values.
- **Expected:** a message under each bad field, e.g. *"Enter a valid email address."*
- **Actual:** the messages exist in the page but are never shown. The site's CSS only displays them when they have a `visible` class (`.rental-error.visible`, `.logistics-error.visible`), and the script never adds it. Text fields get a red border, but an invalid dropdown (e.g. no destination) shows **no visual cue at all**, so the form just appears not to work.
- **Tests:** "invalid fields show their validation message" in `logistics.spec.ts`, `travel.spec.ts`, `rental.spec.ts`
- **Suggested fix:** add `visible` to the error element alongside `invalid`, and style invalid selects.

### LUL-005: Shipment tracker shows a made-up status for any number
- **Severity:** Medium (once live)
- **Steps:** Logistics → enter any tracking number with 3+ characters (e.g. `ABC`) → **Track shipment**.
- **Actual:** a five-stage delivery timeline appears. The stage reached is calculated from the text you typed, and there's no shipment lookup behind it. A customer would see a believable but false status.
- **Test:** `tests/forms/logistics.spec.ts` (tracker tests pin the current behavior)
- **Suggested fix:** connect it to real tracking data, or label it clearly as a demo.

### LUL-006: Chat button is hidden at the very bottom of the page
- **Severity:** Medium
- **Steps:** open the site and look for the chat button without scrolling.
- **Expected:** a floating chat button in the corner of the screen at all times.
- **Actual:** the chat widget is set to "fixed" position, but it sits inside Canva's iframe, which is stretched to the full page height. So "fixed to the bottom of the screen" becomes "fixed to the bottom of the whole page":
  - Desktop 1280×720: the button is at **y ≈ 2635 px** of a 2717 px page, out of view
  - Phone 390×844: the button is at **y ≈ 4372 px** of a 4444 px page, out of view

  Visitors only find the chat if they scroll to the very end.
- **Evidence:** verification script on 2026-10-23 (button position measured, and a click failed with *"element is outside of the viewport"*).

### LUL-007: "Today" uses UTC, so past dates are accepted from 00:00 to 08:00 Manila time
- **Severity:** Medium
- **Where:** travel date (Travel) and pickup date (Car Rental).
- **Actual:** the script works out "today" with `toISOString()`, which is UTC. Between midnight and 8 AM Philippine time, UTC is still on the previous day, so **yesterday's date is accepted**.
- **Tests:** "yesterday (Manila time) is rejected just after midnight" (`travel.spec.ts`) and "yesterday (Manila time) is rejected as a pickup date just after midnight" (`rental.spec.ts`). Both run in the `Asia/Manila` timezone with a fixed clock.
- **Suggested fix:** compare dates in local time (or explicitly in Asia/Manila).

### LUL-008: Old totals stay on screen after an invalid re-submit
- **Severity:** Low
- **Steps:** get a valid total, then change a field to something invalid and submit again.
- **Actual:** the field turns invalid, but the **previous total (and in Travel, the confirmation) is still shown**, as if it applied to the new input.
- **Tests:** "a previous estimate/total is cleared when the next submit is invalid" in all three form specs.

### LUL-009: Site sometimes takes over 10 seconds to appear
- **Severity:** Low (Canva platform)
- **Actual:** usually the site renders in about 3 seconds. Rarely, the page stays blank for over 10 seconds while Canva loads the embedded site.
- **Evidence:** 1 of 171 automated runs (2026-10-23). It probably also caused the first CI run to fail (unconfirmed). The tests now wait up to 20 seconds.

### LUL-010: Nav clicks are ignored for a moment after the page appears
- **Severity:** Low
- **Actual:** the menu buttons appear before the site's script is ready, so a very quick click does nothing. Real visitors rarely click that fast.
- **Evidence:** 1 of 5 runs of a smoke test (2026-10-22). The tests now retry the click.

### LUL-011: 0 or negative travelers is silently priced as 1 traveler
- **Severity:** Low
- **Steps:** Travel booking → Travelers `0` (or `-2`) → **Get booking total**.
- **Actual:** no error. The result shows "× 1" and the price for one person.
- **Test:** `travel.spec.ts` → "0 travelers is priced as 1 traveler" (pins current behavior)

### LUL-012: Weight field allows 0.5 kg although its minimum is 1
- **Severity:** Low
- **Actual:** the weight input says `min="1"`, but the script accepts any weight above 0, e.g. 0.5 kg.

### LUL-013: Two icons don't render
- **Severity:** Low
- **Actual:** the browser console warns that the icons `layers-3` and `route` were not found in the icon set (Lucide), so those icons show as blank. Where on the page they appear is not identified yet.

### LUL-014: Tailwind is loaded from its development CDN
- **Severity:** Low (performance)
- **Actual:** the console warns *"cdn.tailwindcss.com should not be used in production"*. That version compiles styles in the visitor's browser on every page load, which is slower than a built stylesheet.

### LUL-015: "Get a quote" button is missing on phones
- **Severity:** Low (question for the owner)
- **Actual:** at phone width (390 px), the header's **Get a quote** button is hidden, even when the menu is open. If that's intended, ignore this. If not, add it to the mobile menu.
