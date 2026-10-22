import { test as base, expect, Request } from '@playwright/test';

// Recon (2026-10-22): the site's forms are client-side only. The only expected non-GET
// traffic is Canva's console-log telemetry posted back to its own codelet URL.
const ALLOWED_NON_GET = [/\.canvacode\.com\/codelet\//];

type NetworkGuard = {
  requests: Request[];
  // Fails if any of the given values (e.g. typed form input) appears in an outgoing request
  expectNotSent: (...values: string[]) => void;
};

export const test = base.extend<{ networkGuard: NetworkGuard }>({
  networkGuard: [async ({ page }, use) => {
    const requests: Request[] = [];
    page.on('request', r => requests.push(r));

    await use({
      requests,
      expectNotSent: (...values) => {
        for (const r of requests) {
          const sent = `${r.url()} ${r.postData() ?? ''}`;
          for (const value of values) {
            expect(sent, `"${value}" left the browser via ${r.method()} ${r.url()}`).not.toContain(value);
          }
        }
      },
    });

    // Runs after every test: any non-GET request outside the allowlist fails the test
    const unexpected = requests
      .filter(r => r.method() !== 'GET' && !ALLOWED_NON_GET.some(p => p.test(r.url())))
      .map(r => `${r.method()} ${r.url()}`);
    expect(unexpected, 'Unexpected non-GET request left the page').toEqual([]);
  }, { auto: true }],
});

export { expect };
