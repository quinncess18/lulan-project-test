import { Page } from '@playwright/test';
import { ViewPage } from './ViewPage';

export class RentalView extends ViewPage {
  constructor(page: Page) {
    super(page, 'rental');
  }
}
