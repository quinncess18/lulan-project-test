# Test Plan — Lulan (DRAFT)

Live-site UI testing: smoke, page checks, form fill-up, loading, and visual.
No backend access and no test data. The live site is treated as a black box.

**Legend**
- ⬜ Not started
- 🔵 Exists, not yet gap-analyzed
- ✅ Reviewed

---

## 0. Open Questions (fill in before scaffolding)

| # | Question | Answer |
|---|---|---|
| 1 | Base URL of the live site | `https://lulan.com.ph/` (owner approved testing; low traffic) |
| 2 | List of pages to cover (paths) | No separate paths. It's a one-page Canva site, and all content sits in **one cross-origin iframe** (`*.canvacode.com`). Its nav buttons switch between views: Home, Logistics, Travel & Tours, Car Rental, IT Services |
| 3 | List of forms (contact, newsletter, booking, login, etc.) | `#logistics-quote-form`, `#logistics-tracker-form`, `#travel-booking-form`, `#rental-calculator`, `#contact-form`, `#chatInputForm` (+ chat name/email/service), IT quote basket. None has an `action` attribute |
| 4 | Is real form submission on prod allowed? (emails/leads get created) | **Moot: the forms send nothing.** A one-time recon on 2026-10-22 submitted the contact form, an IT quote, and an AI-chat message. All of them only update the page ("Your inquiry is ready…", basket total, canned AI reply). The only POST is Canva's console-log telemetry to `*.canvacode.com/codelet/…`, which never contains form data. So we test forms for real (no mocks), and a network guard fails the test if any form value leaves the browser. The Live Chat intro (`#chatName`/`#chatEmail`) wasn't reached: the launcher sits off-screen inside the 2717px-tall iframe |
| 5 | Any CAPTCHA / reCAPTCHA on the forms? | None found |
| 6 | Does the site use stable `data-testid` attributes, or do we rely on roles/labels? | No `data-testid`, but descriptive `id`s throughout (`#travel-email`, `#logistics-total`, …) → use ids/roles **inside `frameLocator()`** |
| 7 | Browsers / devices needed (desktop Chrome only, or Firefox/WebKit/mobile too)? | _TBD_ |
| 8 | Run in CI (GitHub Actions), or local only? | _TBD_ |

---

## 1. Scope

**In scope**
- Smoke: site is up, key pages load, no fatal console errors
- Pages: navigation, header/footer, links, images, page titles
- Forms: client-side validation and submission behavior, with the backend **mocked**
- Loading: load-time budgets, broken assets, loading states/spinners
- Visual: screenshot baselines on desktop, tablet, and mobile

**Out of scope**
- Backend/API correctness, database state, emails actually being delivered
- Login-protected areas (unless credentials are provided)
- Load/stress testing, security testing

---

## 2. How we test without the backend

The key idea is to **intercept the browser's network calls with Playwright `page.route()`**.

| Need | Approach |
|---|---|
| Find what the form calls | Submit once manually with DevTools → Network open (or a `page.on('request')` recon script), and note the URL, method, and payload |
| Don't create junk data on prod | `page.route('**/<form-endpoint>', r => r.fulfill({ status: 200, body: ... }))`. The request never reaches the server |
| Verify the form sends the right data | Capture the intercepted request and assert on `request.postDataJSON()` / form fields |
| Test the success UI | Fulfill with a 200 → assert the thank-you message/redirect |
| Test the error UI | Fulfill with 400/500, or `route.abort()` → assert that an error message appears and the form keeps its input |
| Test the loading state | Delay the fulfill (e.g. 2s) → assert the spinner shows / the button is disabled (no double submit) |
| Third-party embeds (Google Forms, HubSpot, Formspree, etc.) | Same: route their submit URL. If it's an iframe, scope locators with `frameLocator()` |
| CAPTCHA | Can't be automated on prod. Stop at the step just before it, or mock the verification call. Flag it as a limitation |

> Rule: **every form test in this suite must have a route mock in place before submit.** Add a guard that fails the test if an un-mocked POST leaves the page.

---

## 3. Scenarios

### 3.1 Smoke — `tests/smoke/*.smoke.spec.ts`

| # | Scenario | Type | Status |
|---|---|---|---|
| 1 | Homepage returns HTTP 200 and renders the main heading | Happy path | 🔵 |
| 2 | Each nav view (Logistics, Travel & Tours, Car Rental, IT Services) opens and shows its H1. _Adapted: one URL, no per-page titles_ | Happy path | 🔵 |
| 3 | No uncaught JS errors in console on key pages | Health | 🔵 |
| 4 | Primary navigation buttons are visible and enabled | Happy path | 🔵 |
| 5 | Unknown path shows a 404 page (not a blank/500) | Negative | 🔵 |

### 3.2 Pages — `tests/pages-check/*.spec.ts`

| # | Scenario | Type | Status |
|---|---|---|---|
| 1 | Header and footer render consistently on every page | Happy path | ⬜ |
| 2 | Every nav link goes to the correct page/URL | Happy path | ⬜ |
| 3 | No broken internal links (`request.head` → status < 400) | Health | ⬜ |
| 4 | No broken images (`naturalWidth > 0`) | Health | ⬜ |
| 5 | External links open in a new tab with `rel="noopener"` | Edge case | ⬜ |
| 6 | Mobile menu (hamburger) opens/closes and links work | Happy path | ⬜ |

### 3.3 Forms — `tests/forms/*.spec.ts` (backend mocked)

Repeat this table per form once the forms are known.

| # | Scenario | Type | Status |
|---|---|---|---|
| 1 | Form fields, labels, and submit button are visible | Happy path | ⬜ |
| 2 | Valid fill-up → submit → success message (mocked 200) | Happy path | ⬜ |
| 3 | Submitted payload contains the entered values | Happy path | ⬜ |
| 4 | Required fields empty → validation messages, no request sent | Negative | ⬜ |
| 5 | Invalid email / phone format → validation message | Negative | ⬜ |
| 6 | Server error (mocked 500) → user sees an error, input is kept | Negative | ⬜ |
| 7 | Network failure (`route.abort`) → user sees an error | Negative | ⬜ |
| 8 | Slow response → loading state shown, button disabled (no double submit) | Edge case | ⬜ |
| 9 | Max-length / special characters accepted or rejected per spec | Edge case | ⬜ |

### 3.4 Loading / Performance — `tests/loading/*.spec.ts`

| # | Scenario | Type | Status |
|---|---|---|---|
| 1 | DOMContentLoaded under budget (e.g. < 3s) on key pages | Budget | ⬜ |
| 2 | Full `load` under budget (e.g. < 5s) | Budget | ⬜ |
| 3 | No failed network requests (4xx/5xx) for page assets | Health | ⬜ |
| 4 | Lazy-loaded images load after scroll | Happy path | ⬜ |
| 5 | Page still usable on throttled network (slow 3G via CDP, Chromium only) | Edge case | ⬜ |

> Timing on a live site is noisy, so budgets should be generous and get tightened after the first few runs.
> Timings come from `performance.getEntriesByType('navigation')`.

### 3.5 Visual — `tests/visual/*.visual.spec.ts`

| # | Scenario | Type | Status |
|---|---|---|---|
| 1 | Homepage above-the-fold baseline | Visual | ⬜ |
| 2 | Each key page full-page baseline | Visual | ⬜ |
| 3 | Header / footer component baselines | Visual | ⬜ |
| 4 | Form default + validation-error state baselines | Visual | ⬜ |
| 5 | Responsive: desktop 1280, widescreen 1920, tablet, mobile | Visual | ⬜ |

> Live content changes (banners, carousels, dates, ads). Use `mask: [...]` on dynamic regions, disable animations, and wait for fonts/images using the `stablePage` fixture (`fixtures/visual-fixture.ts`).

---

## 4. Proposed structure

```
lulan-project-test/
├── fixtures/
│   ├── visual-fixture.ts
│   └── network-guard.ts        # fails test on un-mocked POST
├── tests/
│   ├── pages/                  # page objects (BasePage + per page)
│   ├── smoke/
│   ├── pages-check/
│   ├── forms/
│   ├── loading/
│   └── visual/
├── playwright.config.ts
├── TEST_PLAN.md
└── package.json
```

---

## 5. Risks & limitations

- **Live site changes without notice.** Visual baselines will need re-approval, and selectors may break.
- **Mocked forms prove the front-end only.** They don't prove the backend actually receives or stores submissions.
- **CAPTCHA / bot protection** may block automation or rate-limit CI runners.
- **Performance numbers depend on the network** of whatever machine runs them. Treat them as trend checks, not hard SLAs.
