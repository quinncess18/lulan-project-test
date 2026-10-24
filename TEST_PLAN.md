# Test Plan — Lulan

Live-site UI testing: smoke, page checks, forms, loading, and visual.
No backend access and no test data. The live site is treated as a black box, with the owner's permission.

**Legend**
- ⬜ Not started
- 🔵 Exists, not yet gap-analyzed
- ✅ Reviewed
- — Not applicable

---

## 0. Open Questions

| # | Question | Answer |
|---|---|---|
| 1 | Base URL of the live site | `https://lulan.com.ph/` (owner approved testing; low traffic) |
| 2 | List of pages to cover (paths) | No separate paths. It's a one-page Canva site, and all content sits in **one cross-origin iframe** (`*.canvacode.com`). Its nav buttons switch between views: Home, Logistics, Travel & Tours, Car Rental, IT Services |
| 3 | List of forms | `#logistics-quote-form`, `#logistics-tracker-form`, `#travel-booking-form`, `#rental-calculator`, `#contact-form`, `#chatInputForm` (+ Live Chat name/email/service), IT quote basket. None has an `action` attribute |
| 4 | Is real form submission on prod allowed? | **Moot: the forms send nothing.** A one-time recon on 2026-10-22 submitted the contact form, an IT quote, and an AI-chat message. All of them only update the page. The only POST is Canva's console-log telemetry to `*.canvacode.com/codelet/…`, which never contains form data |
| 5 | Any CAPTCHA / reCAPTCHA on the forms? | None found |
| 6 | Stable `data-testid` attributes? | None, but descriptive `id`s throughout (`#travel-email`, `#logistics-total`, …) → ids/roles/labels **inside `frameLocator()`** |
| 7 | Browsers / devices | Chromium (all suites, visual at 4 screen sizes) and Firefox (smoke + functional). WebKit is next |
| 8 | Run in CI (GitHub Actions), or local only? | CI on every push/PR (`windows-latest`), all projects including visual |

---

## 1. Scope

**In scope**
- Smoke: site is up, every view opens, no fatal console errors, 404 page
- Pages: header/footer, footer nav, images, mobile menu
- Forms: client-side validation, computed results, and confirmation messages, tested for real (no mocks)
- Loading: load-time and page-weight budgets, failed requests, slow network
- Visual: screenshot baselines at desktop, widescreen, tablet, and phone sizes
- Site defects found along the way, logged in [`DEFECTS.md`](DEFECTS.md)

**Out of scope**
- Backend/API, database, email delivery (the site has none today)
- Load/stress testing and security testing (beyond checking that typed HTML isn't run)

---

## 2. How we test without a backend

The site is a Canva export, and every form is client-side only, so there is nothing to mock.

| Need | Approach |
|---|---|
| Reach the content | All locators go through `BasePage.frame` (`frameLocator('iframe[title="Embedded content"]')`) |
| Switch views | Click the nav button, retried until the view gets the `active` class (`BasePage.goToView`). Canva attaches its click handlers a moment after the nav appears |
| Test forms safely | Submit for real. Nothing leaves the browser, so no junk data is created |
| Prove nothing is sent | The `networkGuard` auto fixture fails any test that makes an unexpected non-GET request (Canva telemetry to `*.canvacode.com/codelet/` is allowed). `networkGuard.expectNotSent(...)` checks that typed values never appear in any request |
| Track site bugs | Each confirmed defect has a `test.fail()` test tagged `@defect @LUL-xxx`. It starts failing once the owner fixes the bug, as a reminder to remove the `test.fail()` |

---

## 3. Scenarios

### 3.1 Smoke — `tests/smoke/*.smoke.spec.ts`

| # | Scenario | Type | Status |
|---|---|---|---|
| 1 | Homepage returns HTTP 200 and renders the main heading | Happy path | 🔵 |
| 2 | Each nav view (Logistics, Travel & Tours, Car Rental, IT Services) opens and shows its H1 | Happy path | 🔵 |
| 3 | No uncaught JS errors in console on key pages | Health | 🔵 |
| 4 | Primary navigation buttons are visible and enabled | Happy path | 🔵 |
| 5 | Unknown path shows a 404 page (not a blank/500) | Negative | 🔵 |

### 3.2 Pages — `tests/pages-check/*.spec.ts`

| # | Scenario | Type | Status |
|---|---|---|---|
| 1 | Header and footer render on every view | Happy path | 🔵 |
| 2 | Every footer nav button and the brand/logo go to the correct view (header nav: smoke) | Happy path | 🔵 |
| 3 | No broken internal links. _N/A: the site has no `<a href>`; covered by #2_ | Health | — |
| 4 | No broken images on any view, plus header/footer logos | Health | 🔵 |
| 5 | Links opening a new tab use `rel="noopener"` (guards future links; none today) | Edge case | 🔵 |
| 6 | Mobile menu (hamburger) opens, switches the view, and closes | Happy path | 🔵 |

### 3.3 Forms — `tests/forms/*.spec.ts` (real, no mocks)

Covered: logistics freight estimate + shipment tracker, travel booking, car rental calculator, contact form, IT quote basket, chat widget (AI Assistant + Live Chat intake).

| # | Scenario | Type | Status |
|---|---|---|---|
| 1 | Form fields, labels, and submit button are visible | Happy path | 🔵 |
| 2 | Valid fill-up → result shown with correct computed values | Happy path | 🔵 |
| 3 | Typed values never leave the browser (`networkGuard.expectNotSent`) | Happy path | 🔵 |
| 4 | Required fields empty → fields marked invalid, no result | Negative | 🔵 |
| 5 | Invalid email / out-of-range numbers / bad date order rejected | Negative | 🔵 |
| 6 | Server error, network failure, slow response. _N/A: forms send nothing_ | Negative | — |
| 7 | Accented names, emoji, and a 5,000-character message are accepted; typed HTML is shown as text, never run (contact form, AI chat) | Edge case | 🔵 |

### 3.4 Loading / Performance — `tests/loading/*.spec.ts`

| # | Scenario | Type | Status |
|---|---|---|---|
| 1 | DOMContentLoaded < 4 s; site drawn in the iframe < 8 s | Budget | 🔵 |
| 2 | Full `load` < 7 s; page weight < 4 MB | Budget | 🔵 |
| 3 | No failed requests (4xx/5xx/aborted) while loading and visiting every view | Health | 🔵 |
| 4 | Lazy-loaded images load after scroll. _Covered by pages-check "no broken images"_ | Happy path | 🔵 |
| 5 | Site renders and a view switch works on Fast 3G (CDP, Chromium only: tagged `@chromium-only`) | Edge case | 🔵 |

> Baseline measured 2026-10-23 (cold load): DOMContentLoaded 2.96 s, load 4.89 s, site visible 4.97 s, 2.85 MB. On Fast 3G the site was visible after ~14.8 s.
> Timing on a live site is noisy, so budgets are generous; tighten them after a few runs.

### 3.5 Visual — `tests/visual/*.visual.spec.ts`

| # | Scenario | Type | Status |
|---|---|---|---|
| 1 | Each of the 5 views, full-page baseline | Visual | 🔵 |
| 2 | Header / footer component baselines (desktop + phone) | Visual | 🔵 |
| 3 | Contact and travel forms in validation-error state (desktop + phone) | Visual | 🔵 |
| 4 | Responsive: desktop 1280, widescreen 1920, tablet 768, phone 390 | Visual | 🔵 |

> Notes:
> - Visual projects always run **headless** in Chromium (headed and headless render differently). Baselines are Windows (`-win32`) and CI runs on `windows-latest` to match. Update the baselines with `npm run test:visual:update`.
> - Chromium only paints the part of the cross-origin Canva iframe that is inside the window, so `BasePage.fitViewportToPage()` makes the window as tall as the iframe before a full-page shot. The site's layout doesn't depend on window height.
> - No masks are needed today. The site has no rotating or date-based content, and animations are disabled in the config.

---

## 4. Structure

```
lulan-project-test/
├── fixtures/
│   ├── network-guard.ts        # auto fixture: fails on unexpected non-GET; expectNotSent()
│   └── visual-fixture.ts       # stablePage for screenshot tests
├── tests/
│   ├── pages/                  # Page Object Model (BasePage → ViewPage → 5 views)
│   │   └── components/         # header, footer, mobile menu, contact, chat, load metrics
│   ├── smoke/
│   ├── pages-check/
│   ├── forms/
│   ├── loading/
│   └── visual/
├── playwright.config.ts
├── DEFECTS.md
├── TEST_PLAN.md
└── package.json
```

---

## 5. Risks & limitations

- **Live site changes without notice.** Visual baselines will need re-approval, and selectors may break. The site is a Canva export, so a re-publish can change the markup.
- **Forms are client-side only.** The tests prove what the visitor sees, not that an inquiry reaches anyone. Today nothing does (LUL-001, LUL-002).
- **Canva render time varies.** The site sometimes takes over 10 s to appear (LUL-009), so page loads wait up to 20 s and CI retries failures twice.
- **Performance numbers depend on the network** of the machine running them. Treat them as trend checks, not hard SLAs.
- **Visual baselines are platform-specific** (Windows). Running them on macOS/Linux needs a separate set of baselines.
