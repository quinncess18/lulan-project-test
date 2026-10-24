import { defineConfig, devices } from '@playwright/test';

const BROWSERS = {
  chromium: { ...devices['Desktop Chrome'] },
  firefox: {
    ...devices['Desktop Firefox'],
    launchOptions: {
      headless: !!process.env.CI,
      // Headed Firefox on Windows pauses rendering in a window covered by another one,
      // so clicks hang waiting for the element to be "stable". Keep rendering on.
      firefoxUserPrefs: { 'widget.windows.window_occlusion_tracking.enabled': false },
    },
  },
  webkit: { ...devices['Desktop Safari'] }, // Safari's engine
};

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
  /* One browser window at a time locally so headed runs are easy to watch; 3 at once on CI
     (the loading projects are run separately on CI with --workers=1, see the workflow) */
  workers: process.env.CI ? 3 : 1,
  testMatch: '**/*.spec.ts',
  reporter: [
    ['list'],
    ...(process.env.CI ? [['github'] as ['github']] : []), // failures as annotations on the Actions run
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
      use: BROWSERS.chromium,
    },

    // Functional tests (pages-check, forms) in each browser. Firefox and WebKit also run smoke.
    // Chromium-only tests (CDP throttling) are tagged @chromium-only.
    { name: 'chromium', testIgnore: ['**/*.smoke.spec.ts', '**/*.visual.spec.ts', '**/loading/**'], use: BROWSERS.chromium },
    { name: 'firefox', testIgnore: ['**/*.visual.spec.ts', '**/loading/**'], grepInvert: /@chromium-only/, use: BROWSERS.firefox },
    { name: 'webkit', testIgnore: ['**/*.visual.spec.ts', '**/loading/**'], grepInvert: /@chromium-only/, use: BROWSERS.webkit },

    // Loading tests measure time, so they get their own projects. CI runs these first with
    // --workers=1, so no other test competes for CPU or network while timing is measured.
    ...(['chromium', 'firefox', 'webkit'] as const).map(browser => ({
      name: `loading-${browser}`,
      testMatch: /loading\/.*\.spec\.ts/,
      grepInvert: browser === 'chromium' ? undefined : /@chromium-only/,
      use: BROWSERS[browser],
    })),

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
