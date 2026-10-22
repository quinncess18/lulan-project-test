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
      open: 'always',  // 'always' | 'never' | 'on-failure'
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
  ],
});
