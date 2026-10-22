import { Page } from '@playwright/test';
import { ViewPage } from './ViewPage';

export class TravelView extends ViewPage {
  constructor(page: Page) {
    super(page, 'travel');
  }
}
