import { expect, test } from '../../fixtures/pages.fixture';

test.describe('KAN-5 cart', () => {
  test(
    'TC-KAN5-016 Adding Backpack and Bike Light sets the cart badge to 2',
    { tag: ['@KAN-5', '@cart', '@smoke', '@regression'] },
    async ({ kan5, loggedInInventoryPage }) => {
      await loggedInInventoryPage.addBackpack();
      await loggedInInventoryPage.addBikeLight();

      await expect(loggedInInventoryPage.cartBadge).toHaveText(kan5.cartBadge.two);
    },
  );

  test(
    'TC-KAN5-017 Cart badge is not shown when no product has been added',
    { tag: ['@KAN-5', '@cart', '@regression'] },
    async ({ loggedInInventoryPage }) => {
      await expect(loggedInInventoryPage.cartLink).toBeVisible();
      await expect(loggedInInventoryPage.cartBadge).toHaveCount(0);
    },
  );

  test(
    'TC-KAN5-018 Adding a single product sets the cart badge to 1',
    { tag: ['@KAN-5', '@cart', '@regression'] },
    async ({ kan5, loggedInInventoryPage }) => {
      await loggedInInventoryPage.addBackpack();

      await expect(loggedInInventoryPage.cartBadge).toHaveText(kan5.cartBadge.one);
    },
  );

  test(
    'TC-KAN5-019 Removing Bike Light on the Products page sets the cart badge to 1',
    { tag: ['@KAN-5', '@cart', '@smoke', '@regression'] },
    async ({ kan5, loggedInInventoryPage }) => {
      await loggedInInventoryPage.addBackpack();
      await loggedInInventoryPage.addBikeLight();
      await loggedInInventoryPage.removeBikeLight();

      await expect(loggedInInventoryPage.cartBadge).toHaveText(kan5.cartBadge.one);
    },
  );

  test(
    'TC-KAN5-020 Removed Bike Light is no longer listed in the cart',
    { tag: ['@KAN-5', '@cart', '@regression'] },
    async ({ page, kan5, inventoryWithBackpackAndBikeLight, cartPage }) => {
      await inventoryWithBackpackAndBikeLight.removeBikeLight();
      await inventoryWithBackpackAndBikeLight.openCart();

      await expect(page).toHaveURL(kan5.urls.cart);
      await expect(cartPage.cartItemNames).toHaveText([kan5.products.backpack]);
    },
  );

  test(
    'TC-KAN5-021 Removing Bike Light from the Cart page sets the cart badge to 1 (AMB-05 additional scenario)',
    { tag: ['@KAN-5', '@cart', '@regression'] },
    async ({ page, kan5, inventoryWithBackpackAndBikeLight, cartPage }) => {
      await inventoryWithBackpackAndBikeLight.openCart();
      await expect(page).toHaveURL(kan5.urls.cart);
      await cartPage.removeBikeLight();

      await expect(inventoryWithBackpackAndBikeLight.cartBadge).toHaveText(kan5.cartBadge.one);
    },
  );

  test(
    'TC-KAN5-022 Removing the last remaining product hides the cart badge',
    { tag: ['@KAN-5', '@cart', '@regression'] },
    async ({ inventoryWithBackpackAndBikeLight }) => {
      await inventoryWithBackpackAndBikeLight.removeBikeLight();
      await inventoryWithBackpackAndBikeLight.removeBackpack();

      await expect(inventoryWithBackpackAndBikeLight.cartBadge).toHaveCount(0);
    },
  );

  test(
    'TC-KAN5-057 Removing Bike Light does not remove Backpack from the cart',
    { tag: ['@KAN-5', '@cart', '@regression'] },
    async ({ inventoryWithBackpackAndBikeLight }) => {
      await inventoryWithBackpackAndBikeLight.removeBikeLight();

      await expect(inventoryWithBackpackAndBikeLight.addBikeLightButton).toBeVisible();
      await expect(inventoryWithBackpackAndBikeLight.removeBackpackButton).toBeVisible();
    },
  );

  test(
    'TC-KAN5-061 Cart badge still shows 2 after reloading the Products page',
    { tag: ['@KAN-5', '@cart', '@regression'] },
    async ({ page, kan5, inventoryWithBackpackAndBikeLight }) => {
      await expect(inventoryWithBackpackAndBikeLight.cartBadge).toHaveText(kan5.cartBadge.two);

      await inventoryWithBackpackAndBikeLight.reload();

      await expect(page).toHaveURL(kan5.urls.inventory);
      await expect(inventoryWithBackpackAndBikeLight.cartBadge).toHaveText(kan5.cartBadge.two);
    },
  );

  test(
    'TC-KAN5-062 Cart badge still shows 2 after opening the Cart page and returning to Products',
    { tag: ['@KAN-5', '@cart', '@regression'] },
    async ({ page, kan5, inventoryWithBackpackAndBikeLight, cartPage }) => {
      await inventoryWithBackpackAndBikeLight.openCart();
      await expect(page).toHaveURL(kan5.urls.cart);
      await cartPage.continueShopping();

      await expect(page).toHaveURL(kan5.urls.inventory);
      await expect(inventoryWithBackpackAndBikeLight.cartBadge).toHaveText(kan5.cartBadge.two);
    },
  );
});
