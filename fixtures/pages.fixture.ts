import { test as base } from '@playwright/test';
import { CartPage } from '../pages/CartPage';
import { InventoryPage } from '../pages/InventoryPage';
import { LoginPage } from '../pages/LoginPage';
import kan5Data from '../test-data/KAN-5.json';
import { getEnv, type Env } from '../utils/env';

export type Kan5Data = typeof kan5Data;

type PageFixtures = {
  /** Base URL and credentials read from .env through utils/env.ts. */
  env: Env;
  /** Non-sensitive inputs and expected values from test-data/KAN-5.json. */
  kan5: Kan5Data;
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  /** Logged in as the standard user; Products page (/inventory.html) is displayed. */
  loggedInInventoryPage: InventoryPage;
  /** Logged in as the standard user with Sauce Labs Backpack and Sauce Labs Bike Light added from the Products page. */
  inventoryWithBackpackAndBikeLight: InventoryPage;
};

export const test = base.extend<PageFixtures>({
  env: async ({}, use) => {
    await use(getEnv());
  },

  kan5: async ({}, use) => {
    await use(kan5Data);
  },

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },

  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },

  loggedInInventoryPage: async ({ page, env, loginPage, inventoryPage }, use) => {
    await loginPage.goto();
    await loginPage.login(env.standardUser, env.userPassword);
    await page.waitForURL(`**${kan5Data.urls.inventory}`);
    await use(inventoryPage);
  },

  inventoryWithBackpackAndBikeLight: async ({ loggedInInventoryPage }, use) => {
    await loggedInInventoryPage.addBackpack();
    await loggedInInventoryPage.addBikeLight();
    await loggedInInventoryPage.removeBikeLightButton.waitFor({ state: 'visible' });
    await use(loggedInInventoryPage);
  },
});

export { expect } from '@playwright/test';
