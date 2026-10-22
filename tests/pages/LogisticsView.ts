import { Page } from '@playwright/test';
import { ViewPage } from './ViewPage';

export class LogisticsView extends ViewPage {
  constructor(page: Page) {
    super(page, 'logistics');
  }
}
