import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000, // 30 seconds per test — live site, Canva iframe takes ~3s to render

  expect: {
    timeout: 10000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02, // 2% difference allowed
      threshold: 0.1,
      animations: 'disabled',
      caret: 'hide',
    },
  },

  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* One browser window at a time so headed runs are easy to watch */
  workers: 1,
  testMatch: '**/*.spec.ts',
  reporter: [
    ['list'],
    ['blob'],
    ['html', {
      open: process.env.CI ? 'never' : 'always',  // 'always' | 'never' | 'on-failure' — never on CI so the job doesn't hang serving the report
    }],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL: 'https://lulan.com.ph',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    launchOptions: {
      // slowMo: 500, // Uncomment to slow each action down while watching
      headless: !!process.env.CI, // Headed locally so runs can be watched; headless on CI
    },
  },
  snapshotPathTemplate: '{testDir}/{testFileDir}/{testFileName}-snapshots/{arg}-{projectName}-{platform}{ext}',

  projects: [
    // Smoke tests - quick health check of the live site
    {
      name: 'smoke-chromium',
      testMatch: /.*\.smoke\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    // Functional tests (pages-check, forms, loading) - excluding smoke and visual
    {
      name: 'chromium',
      testIgnore: ['**/*.smoke.spec.ts', '**/*.visual.spec.ts'],
      use: { ...devices['Desktop Chrome'] },
    },

    // Visual tests - always headless (headed and headless Chromium render slightly differently,
    // so baselines must be made and compared in the same mode). Baselines are Windows (win32);
    // CI runs on windows-latest to match.
    // Component/form-state baselines (components.visual.spec.ts) run on desktop and phone only.
    ...[
      { name: 'visual-desktop', viewport: { width: 1280, height: 720 }, components: true },
      { name: 'visual-widescreen', viewport: { width: 1920, height: 1080 }, components: false },
      { name: 'visual-tablet', viewport: { width: 768, height: 1024 }, components: false },
      { name: 'visual-mobile', viewport: { width: 390, height: 844 }, components: true },
    ].map(({ name, viewport, components }) => ({
      name,
      testMatch: /.*\.visual\.spec\.ts/,
      testIgnore: components ? [] : ['**/components.visual.spec.ts'],
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'], viewport, launchOptions: { headless: true } },
    })),
  ],
});
