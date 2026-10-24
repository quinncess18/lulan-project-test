import { test, expect } from '../../fixtures/visual-fixture';
import { ViewName } from '../pages';
import { showView } from './show-view';

const VIEWS: ViewName[] = ['home', 'logistics', 'travel', 'rental', 'it'];

test.describe('Visual - views', () => {
  for (const view of VIEWS) {
    test(`${view} view (full page)`, async ({ stablePage }) => {
      const base = await showView(stablePage, view);

      await expect(base.iframe).toHaveScreenshot(`view-${view}.png`);
    });
  }
});
