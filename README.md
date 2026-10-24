# LULAN PH — Playwright Test Suite

![Playwright](https://img.shields.io/badge/Playwright-45ba4b?style=for-the-badge&logo=playwright&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?style=for-the-badge&logo=typescript&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088f0?style=for-the-badge&logo=github-actions&logoColor=white)

> Live-site UI test automation for [lulan.com.ph](https://lulan.com.ph), a multi-service site (logistics, travel & tours, car rental, IT services) built with Canva. There's no backend access: the site is tested as a black box, with the owner's permission.

---

## How the site works (and why it matters for tests)

- `lulan.com.ph` is an empty shell page. All the content sits in **one cross-origin iframe** served from `*.canvacode.com`. Every locator goes through `BasePage.frame`.
- It's **one page with five views**. The nav buttons switch views in place, and the URL never changes.
- The **forms are client-side only**. Contact, quote and chat show a result on the page and send nothing to a server, so they're tested for real, with no mocks.

See [`TEST_PLAN.md`](TEST_PLAN.md) for scope, scenarios and findings.

## Project structure

```
fixtures/
  network-guard.ts     # auto fixture: fails on unexpected non-GET requests
  visual-fixture.ts    # stablePage fixture for screenshot tests
tests/
  pages/               # Page Object Model (BasePage → ViewPage → 5 views)
    components/        # SiteHeader, SiteFooter, MobileMenu
  smoke/               # *.smoke.spec.ts: site up, views, nav, 404
  pages-check/         # header/footer, footer nav, images, mobile menu
  forms/               # contact, logistics, travel, rental, IT quote, chat (real, no mocks)
  loading/             # load-time and page-weight budgets, failed requests, slow 3G
  visual/              # screenshot baselines for 5 views at 4 screen sizes
playwright.config.ts
DEFECTS.md             # site defects found by the suite
```

## Getting started

```bash
npm ci
npx playwright install chromium
```

## Running tests

| Command | What it does |
|---|---|
| `npm test` | Run all tests |
| `npm run test:smoke` | Smoke suite only |
| `npm run test:visual` | Screenshot comparisons only |
| `npm run test:visual:update` | Re-take the screenshot baselines after an intended site change |
| `npm run test:ui` | Playwright UI mode |
| `npm run test:debug` | Step through with the inspector |
| `npm run report` | Open the last HTML report |
| `npx playwright test --grep @defect` | Only the tests for known site defects (see [`DEFECTS.md`](DEFECTS.md)) |

## Known defects

Site defects found by the suite. Full steps, evidence and suggested fixes are in [`DEFECTS.md`](DEFECTS.md). Defects with a test tag have a `test.fail()` test that will start failing once the defect is fixed. Run one with `npx playwright test --grep @LUL-016`.

| ID | Defect | Severity | Test tag |
|---|---|---|---|
| LUL-001 | Contact form promises a follow-up but sends nothing | High | `@defect` `@LUL-001` |
| LUL-002 | Travel form says "Booking request received" but sends nothing | High | `@defect` `@LUL-002` |
| LUL-016 | Live Chat can't be started with any normal email | High | `@defect` `@LUL-016` |
| LUL-004 | Validation messages never appear on the calculator forms | Medium | `@defect` `@LUL-004` |
| LUL-005 | Shipment tracker shows a made-up status for any number | Medium | — |
| LUL-006 | Chat button is hidden at the very bottom of the page | Medium | `@defect` `@LUL-006` |
| LUL-007 | "Today" uses UTC: past dates accepted from 00:00 to 08:00 Manila time | Medium | `@defect` `@LUL-007` |
| LUL-008 | Old totals stay on screen after an invalid re-submit | Low | `@defect` `@LUL-008` |
| LUL-009 | Site sometimes takes over 10 seconds to appear | Low | — |
| LUL-010 | Nav clicks are ignored for a moment after the page appears | Low | — |
| LUL-011 | 0 or negative travelers is silently priced as 1 traveler | Low | — |
| LUL-012 | Weight field allows 0.5 kg although its minimum is 1 | Low | — |
| LUL-013 | Two icons don't render ("layers-3", "route") | Low | — |
| LUL-014 | Tailwind is loaded from its development CDN | Low | — |
| LUL-015 | "Get a quote" button is missing on phones | Low | — |
| LUL-017 | AI chat gives the IT answer to any question containing "it" | Low | `@defect` `@LUL-017` |

Closed: LUL-003 (not a defect; see `DEFECTS.md`).

## License

[MIT](LICENSE)
