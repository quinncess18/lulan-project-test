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
npx playwright install chromium firefox webkit
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

## License

[MIT](LICENSE)
