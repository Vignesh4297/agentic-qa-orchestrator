import { expect, test } from '../../fixtures/pages.fixture';

test.describe('KAN-5 sorting', () => {
  test(
    'TC-KAN5-023 Sort by Price (low to high) shows prices in ascending order',
    { tag: ['@KAN-5', '@sorting', '@regression'] },
    async ({ kan5, loggedInInventoryPage }) => {
      await loggedInInventoryPage.sortBy(kan5.sortOptions.priceLowToHigh);

      await expect(loggedInInventoryPage.itemPrices).toHaveText(kan5.expected.pricesLowToHigh);
    },
  );

  test(
    'TC-KAN5-024 Sort by Price (low to high) after Name (Z to A) re-sorts to ascending price',
    { tag: ['@KAN-5', '@sorting', '@regression'] },
    async ({ kan5, loggedInInventoryPage }) => {
      await loggedInInventoryPage.sortBy(kan5.sortOptions.nameZtoA);
      await loggedInInventoryPage.sortBy(kan5.sortOptions.priceLowToHigh);

      await expect(loggedInInventoryPage.itemPrices).toHaveText(kan5.expected.pricesLowToHigh);
    },
  );

  test(
    'TC-KAN5-026 Sort by Name (Z to A) shows products in reverse alphabetical order',
    { tag: ['@KAN-5', '@sorting', '@regression'] },
    async ({ kan5, loggedInInventoryPage }) => {
      await loggedInInventoryPage.sortBy(kan5.sortOptions.nameZtoA);

      await expect(loggedInInventoryPage.itemNames).toHaveText(kan5.expected.namesZtoA);
    },
  );

  test(
    'TC-KAN5-027 Sort by Name (Z to A) after Price (low to high) re-sorts to reverse alphabetical order',
    { tag: ['@KAN-5', '@sorting', '@regression'] },
    async ({ kan5, loggedInInventoryPage }) => {
      await loggedInInventoryPage.sortBy(kan5.sortOptions.priceLowToHigh);
      await loggedInInventoryPage.sortBy(kan5.sortOptions.nameZtoA);

      await expect(loggedInInventoryPage.itemNames).toHaveText(kan5.expected.namesZtoA);
    },
  );

  test(
    'TC-KAN5-058 Sort by Name (Z to A) does not show prices in ascending order',
    { tag: ['@KAN-5', '@sorting', '@regression'] },
    async ({ kan5, loggedInInventoryPage }) => {
      await loggedInInventoryPage.sortBy(kan5.sortOptions.nameZtoA);

      await expect(loggedInInventoryPage.itemPrices).toHaveText(kan5.expected.pricesInNameZtoAOrder);
    },
  );

  test(
    'TC-KAN5-059 Sort by Price (low to high) does not show names in Z to A order',
    { tag: ['@KAN-5', '@sorting', '@regression'] },
    async ({ kan5, loggedInInventoryPage }) => {
      await loggedInInventoryPage.sortBy(kan5.sortOptions.priceLowToHigh);

      await expect(loggedInInventoryPage.itemNames.first()).toHaveText(kan5.expected.firstNamePriceLowToHigh);
    },
  );
});
