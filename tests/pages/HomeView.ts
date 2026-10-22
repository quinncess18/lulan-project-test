import { Page } from '@playwright/test';
import { ViewPage } from './ViewPage';

export class HomeView extends ViewPage {
  constructor(page: Page) {
    super(page, 'home');
  }
}
