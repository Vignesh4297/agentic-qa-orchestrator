import type { Locator, Page } from '@playwright/test';

export class CartPage {
  readonly page: Page;
  readonly cartItemNames: Locator;
  readonly removeBikeLightButton: Locator;
  readonly continueShoppingButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartItemNames = page.getByTestId('inventory-item-name');
    this.removeBikeLightButton = page.getByTestId('remove-sauce-labs-bike-light');
    this.continueShoppingButton = page.getByTestId('continue-shopping');
  }

  async removeBikeLight(): Promise<void> {
    await this.removeBikeLightButton.click();
  }

  async continueShopping(): Promise<void> {
    await this.continueShoppingButton.click();
  }
}
