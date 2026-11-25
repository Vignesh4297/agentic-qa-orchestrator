import { expect, test } from '../../fixtures/pages.fixture';

test.describe('KAN-5 logout and access control', () => {
  test(
    'TC-KAN5-048 Logout from the menu returns the user to the login page',
    { tag: ['@KAN-5', '@logout', '@smoke', '@regression'] },
    async ({ page, kan5, loggedInInventoryPage, loginPage }) => {
      await loggedInInventoryPage.logout();

      await expect(page).toHaveURL(kan5.urls.login);
      await expect(loginPage.loginButton).toBeVisible();
    },
  );

  test(
    'TC-KAN5-049 Opening the menu without clicking Logout keeps the user on the Products page',
    { tag: ['@KAN-5', '@logout', '@regression'] },
    async ({ page, kan5, loggedInInventoryPage, loginPage }) => {
      await loggedInInventoryPage.openMenu();

      await expect(loggedInInventoryPage.logoutLink).toBeVisible();
      await expect(page).toHaveURL(kan5.urls.inventory);
      await expect(loggedInInventoryPage.pageTitle).toHaveText(kan5.inventory.title);
      await expect(loginPage.loginButton).toBeHidden();
    },
  );

  test(
    'TC-KAN5-050 After logout opening /inventory.html directly shows the access error',
    { tag: ['@KAN-5', '@logout', '@security', '@regression'] },
    async ({ kan5, loggedInInventoryPage, loginPage }) => {
      await loggedInInventoryPage.logout();
      await expect(loginPage.loginButton).toBeVisible();

      await loggedInInventoryPage.goto();

      await expect(loginPage.errorMessage).toHaveText(kan5.messages.inventoryAccessDenied);
    },
  );

  test(
    'TC-KAN5-051 Logged-in user opening /inventory.html directly sees the Products page without the access error',
    { tag: ['@KAN-5', '@logout', '@security', '@regression'] },
    async ({ page, kan5, loggedInInventoryPage, loginPage }) => {
      await loggedInInventoryPage.openCart();
      await expect(page).toHaveURL(kan5.urls.cart);

      await loggedInInventoryPage.goto();

      await expect(page).toHaveURL(kan5.urls.inventory);
      await expect(loggedInInventoryPage.pageTitle).toHaveText(kan5.inventory.title);
      await expect(loginPage.errorMessage).toHaveCount(0);
    },
  );
});
