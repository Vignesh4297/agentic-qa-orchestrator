import { expect, test } from '../../fixtures/pages.fixture';

test.describe('KAN-5 inventory', () => {
  test(
    'TC-KAN5-004 Inventory list shows exactly 6 products after login',
    { tag: ['@KAN-5', '@inventory', '@smoke', '@regression'] },
    async ({ kan5, loggedInInventoryPage }) => {
      await expect(loggedInInventoryPage.inventoryItems).toHaveCount(kan5.inventory.expectedCount);
    },
  );

  test(
    'TC-KAN5-005 Opening /inventory.html without any prior login shows the access error',
    { tag: ['@KAN-5', '@inventory', '@security', '@regression'] },
    async ({ kan5, loginPage, inventoryPage }) => {
      await inventoryPage.goto();

      await expect(loginPage.errorMessage).toHaveText(kan5.messages.inventoryAccessDenied);
    },
  );

  test(
    'TC-KAN5-006 Inventory count stays at 6 after sorting',
    { tag: ['@KAN-5', '@inventory', '@regression'] },
    async ({ kan5, loggedInInventoryPage }) => {
      await loggedInInventoryPage.sortBy(kan5.sortOptions.priceLowToHigh);

      await expect(loggedInInventoryPage.itemPrices).toHaveCount(kan5.inventory.expectedCount);
      await expect(loggedInInventoryPage.inventoryItems).toHaveCount(kan5.inventory.expectedCount);
    },
  );
});
