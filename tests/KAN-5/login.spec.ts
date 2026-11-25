import { expect, test } from '../../fixtures/pages.fixture';

test.describe('KAN-5 login', () => {
  test(
    'TC-KAN5-001 Login as standard_user with password secret_sauce opens the Products page',
    { tag: ['@KAN-5', '@login', '@smoke', '@regression'] },
    async ({ page, env, kan5, loginPage, inventoryPage }) => {
      await loginPage.goto();
      await loginPage.fillUsername(env.standardUser);
      await loginPage.fillPassword(env.userPassword);
      await loginPage.submit();

      await expect(page).toHaveURL(kan5.urls.inventory);
      await expect(inventoryPage.pageTitle).toHaveText(kan5.inventory.title);
    },
  );

  test(
    'TC-KAN5-002 Login as standard_user with a wrong password does not open the Products page',
    { tag: ['@KAN-5', '@login', '@regression'] },
    async ({ page, env, kan5, loginPage, inventoryPage }) => {
      await loginPage.goto();
      await loginPage.fillUsername(env.standardUser);
      await loginPage.fillPassword(kan5.invalidPassword);
      await loginPage.submit();

      await expect(loginPage.errorMessage).toBeVisible();
      await expect(page).toHaveURL(kan5.urls.login);
      await expect(inventoryPage.pageTitle).toBeHidden();
    },
  );

  test(
    'TC-KAN5-003 Login with the password in upper case (SECRET_SAUCE) does not open the Products page',
    { tag: ['@KAN-5', '@login', '@regression'] },
    async ({ page, env, kan5, loginPage, inventoryPage }) => {
      await loginPage.goto();
      await loginPage.fillUsername(env.standardUser);
      await loginPage.fillPassword(env.userPassword.toUpperCase());
      await loginPage.submit();

      await expect(loginPage.errorMessage).toBeVisible();
      await expect(page).toHaveURL(kan5.urls.login);
      await expect(inventoryPage.pageTitle).toBeHidden();
    },
  );

  test(
    'TC-KAN5-007 Login as locked_out_user shows the locked-out error',
    { tag: ['@KAN-5', '@login', '@security', '@regression'] },
    async ({ env, kan5, loginPage }) => {
      await loginPage.goto();
      await loginPage.fillUsername(env.lockedUser);
      await loginPage.fillPassword(env.userPassword);
      await loginPage.submit();

      await expect(loginPage.errorMessage).toHaveText(kan5.messages.lockedOut);
    },
  );

  test(
    'TC-KAN5-008 Login as standard_user does not show the locked-out error',
    { tag: ['@KAN-5', '@login', '@security', '@regression'] },
    async ({ page, env, kan5, loginPage }) => {
      await loginPage.goto();
      await loginPage.fillUsername(env.standardUser);
      await loginPage.fillPassword(env.userPassword);
      await loginPage.submit();

      await expect(page).toHaveURL(kan5.urls.inventory);
      await expect(loginPage.errorMessage).toBeHidden();
    },
  );

  test(
    'TC-KAN5-009 Repeated Login clicks for locked_out_user show a single locked-out error',
    { tag: ['@KAN-5', '@login', '@security', '@regression'] },
    async ({ env, kan5, loginPage }) => {
      await loginPage.goto();
      await loginPage.fillUsername(env.lockedUser);
      await loginPage.fillPassword(env.userPassword);
      await loginPage.submit();
      await loginPage.submit();

      await expect(loginPage.errorMessage).toHaveCount(1);
      await expect(loginPage.errorMessage).toHaveText(kan5.messages.lockedOut);
    },
  );

  test(
    'TC-KAN5-010 Login as locked_out_user keeps the user on the login page',
    { tag: ['@KAN-5', '@login', '@security', '@regression'] },
    async ({ page, env, kan5, loginPage }) => {
      await loginPage.goto();
      await loginPage.fillUsername(env.lockedUser);
      await loginPage.fillPassword(env.userPassword);
      await loginPage.submit();

      await expect(loginPage.errorMessage).toBeVisible();
      await expect(page).toHaveURL(kan5.urls.login);
      await expect(loginPage.loginButton).toBeVisible();
    },
  );

  test(
    'TC-KAN5-011 locked_out_user cannot open /inventory.html directly after a rejected login',
    { tag: ['@KAN-5', '@login', '@security', '@regression'] },
    async ({ env, kan5, loginPage, inventoryPage }) => {
      await loginPage.goto();
      await loginPage.fillUsername(env.lockedUser);
      await loginPage.fillPassword(env.userPassword);
      await loginPage.submit();
      await expect(loginPage.errorMessage).toHaveText(kan5.messages.lockedOut);

      await inventoryPage.goto();

      await expect(loginPage.errorMessage).toHaveText(kan5.messages.inventoryAccessDenied);
    },
  );

  test(
    'TC-KAN5-012 Login with empty username and empty password shows Username is required',
    { tag: ['@KAN-5', '@login', '@validation', '@regression'] },
    async ({ kan5, loginPage }) => {
      await loginPage.goto();
      await loginPage.submit();

      await expect(loginPage.errorMessage).toHaveText(kan5.messages.usernameRequired);
    },
  );

  test(
    'TC-KAN5-013 Login with empty username and a filled password shows Username is required',
    { tag: ['@KAN-5', '@login', '@validation', '@regression'] },
    async ({ env, kan5, loginPage }) => {
      await loginPage.goto();
      await loginPage.fillPassword(env.userPassword);
      await loginPage.submit();

      await expect(loginPage.errorMessage).toHaveText(kan5.messages.usernameRequired);
    },
  );

  test(
    'TC-KAN5-014 Login with standard_user and empty password shows Password is required',
    { tag: ['@KAN-5', '@login', '@validation', '@regression'] },
    async ({ env, kan5, loginPage }) => {
      await loginPage.goto();
      await loginPage.fillUsername(env.standardUser);
      await loginPage.submit();

      await expect(loginPage.errorMessage).toHaveText(kan5.messages.passwordRequired);
    },
  );

  test(
    'TC-KAN5-015 Login with locked_out_user and empty password shows Password is required',
    { tag: ['@KAN-5', '@login', '@validation', '@regression'] },
    async ({ env, kan5, loginPage }) => {
      await loginPage.goto();
      await loginPage.fillUsername(env.lockedUser);
      await loginPage.submit();

      await expect(loginPage.errorMessage).toHaveText(kan5.messages.passwordRequired);
    },
  );

  test(
    'TC-KAN5-060 Login as standard_user with a wrong password displays an error message (text not specified in story)',
    { tag: ['@KAN-5', '@login', '@regression'] },
    async ({ env, kan5, loginPage }) => {
      await loginPage.goto();
      await loginPage.fillUsername(env.standardUser);
      await loginPage.fillPassword(kan5.invalidPassword);
      await loginPage.submit();

      await expect(loginPage.errorMessage).toBeVisible();
    },
  );
});
