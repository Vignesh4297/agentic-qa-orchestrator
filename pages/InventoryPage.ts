import type { Locator, Page } from '@playwright/test';

export class InventoryPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly inventoryItems: Locator;
  readonly itemNames: Locator;
  readonly itemPrices: Locator;
  readonly sortDropdown: Locator;
  readonly addBackpackButton: Locator;
  readonly addBikeLightButton: Locator;
  readonly removeBackpackButton: Locator;
  readonly removeBikeLightButton: Locator;
  readonly cartLink: Locator;
  readonly cartBadge: Locator;
  readonly menuButton: Locator;
  readonly logoutLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.getByTestId('title');
    this.inventoryItems = page.getByTestId('inventory-item');
    this.itemNames = page.getByTestId('inventory-item-name');
    this.itemPrices = page.getByTestId('inventory-item-price');
    this.sortDropdown = page.getByTestId('product-sort-container');
    this.addBackpackButton = page.getByTestId('add-to-cart-sauce-labs-backpack');
    this.addBikeLightButton = page.getByTestId('add-to-cart-sauce-labs-bike-light');
    this.removeBackpackButton = page.getByTestId('remove-sauce-labs-backpack');
    this.removeBikeLightButton = page.getByTestId('remove-sauce-labs-bike-light');
    this.cartLink = page.getByTestId('shopping-cart-link');
    this.cartBadge = page.getByTestId('shopping-cart-badge');
    this.menuButton = page.getByRole('button', { name: 'Open Menu' });
    this.logoutLink = page.getByTestId('logout-sidebar-link');
  }

  async goto(): Promise<void> {
    await this.page.goto('/inventory.html');
  }

  async reload(): Promise<void> {
    await this.page.reload();
  }

  async sortBy(optionLabel: string): Promise<void> {
    await this.sortDropdown.selectOption({ label: optionLabel });
  }

  async addBackpack(): Promise<void> {
    await this.addBackpackButton.click();
  }

  async addBikeLight(): Promise<void> {
    await this.addBikeLightButton.click();
  }

  async removeBackpack(): Promise<void> {
    await this.removeBackpackButton.click();
  }

  async removeBikeLight(): Promise<void> {
    await this.removeBikeLightButton.click();
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
  }

  async openMenu(): Promise<void> {
    await this.menuButton.click();
  }

  async logout(): Promise<void> {
    await this.openMenu();
    await this.logoutLink.click();
  }
}
