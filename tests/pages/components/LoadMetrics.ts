import { Page, Request } from '@playwright/test';

export type NavigationTiming = {
  domContentLoaded: number; // ms from navigation start
  load: number;
};

// Collects load timings, page weight and failed requests for the outer page and the Canva iframe
export class LoadMetrics {
  private readonly page: Page;
  readonly failedRequests: string[] = [];
  private bytes = 0;

  constructor(page: Page) {
    this.page = page;
    page.on('response', r => { if (r.status() >= 400) this.failedRequests.push(`${r.status()} ${r.url()}`); });
    page.on('requestfailed', r => this.failedRequests.push(`${r.failure()?.errorText} ${r.url()}`));
    page.on('requestfinished', r => this.addSize(r));
  }

  private async addSize(request: Request) {
    const sizes = await request.sizes().catch(() => null);
    if (sizes) this.bytes += sizes.responseBodySize;
  }

  get megabytes(): number {
    return this.bytes / (1024 * 1024);
  }

  // Navigation Timing of the outer page (call after the "load" event)
  async navigationTiming(): Promise<NavigationTiming> {
    await this.page.waitForLoadState('load');
    return this.page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return { domContentLoaded: nav.domContentLoadedEventEnd, load: nav.loadEventEnd };
    });
  }

  // Chromium only: emulate a "Fast 3G" connection (1.6 Mbps down, 750 kbps up, 150 ms latency)
  async throttleToFast3G() {
    const cdp = await this.page.context().newCDPSession(this.page);
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 150,
      downloadThroughput: (1.6 * 1024 * 1024) / 8,
      uploadThroughput: (750 * 1024) / 8,
    });
  }
}
