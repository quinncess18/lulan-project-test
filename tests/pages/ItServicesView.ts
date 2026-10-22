import { Page } from '@playwright/test';
import { ViewPage } from './ViewPage';

export class ItServicesView extends ViewPage {
  constructor(page: Page) {
    super(page, 'it');
  }
}
