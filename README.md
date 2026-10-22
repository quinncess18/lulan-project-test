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
  smoke/               # *.smoke.spec.ts
playwright.config.ts
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
| `npm run test:ui` | Playwright UI mode |
| `npm run test:debug` | Step through with the inspector |
| `npm run report` | Open the last HTML report |

Locally, tests run **headed** in Chromium, one at a time, so you can watch them. Uncomment `slowMo` in `playwright.config.ts` to slow them down. On CI (`CI=true`), they run headless.

## CI

GitHub Actions runs the suite on every push and pull request (`.github/workflows/playwright.yml`) and uploads the HTML report as an artifact.

## License

[MIT](LICENSE)
