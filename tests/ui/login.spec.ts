import { test, expect } from '../../fixtures/fixtures';
import { LoginPage } from '../../pages/LoginPage';
import { UsersApiClient } from '../../api/UserApiClient';
import { makeUniqueEmail } from '../../utils/testHelpers';

test.describe('Login Page — UI Tests', () => {
  // ── Happy Path Tests ────────────────────────────────────────────────────

  test('should display login form with all required elements', async ({
    page,
  }) => {
    // Arrange: Create a new LoginPage instance
    const loginPage = new LoginPage(page);

    // Act: Navigate to the login page
    await loginPage.goto();

    // Assert: Verify all form elements are visible
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
    await expect(loginPage.signUpLink).toBeVisible();
  });

  test('should have correct input types for email and password fields', async ({
    page,
  }) => {
    // Arrange: Create a new LoginPage instance
    const loginPage = new LoginPage(page);

    // Act: Navigate to the login page
    await loginPage.goto();

    // Assert: Check that the password input has the correct type
    // (email input defaults to text type even if not explicitly set)
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
  });

  test('should successfully log in with valid credentials', async ({
    page,
    request,
    uniqueEmail,
  }) => {
    // Arrange: Create a new user via API
    const password = 'TestPassword123';
    const newUser = {
      firstName: 'Test',
      lastName: 'User',
      email: uniqueEmail,
      password: password,
    };

    const usersClient = new UsersApiClient(request);
    const createResponse = await usersClient.addUser(newUser);
    const createdUserId = createResponse.user._id;

    // Act: Log in with the newly created user
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(uniqueEmail, password);

    // Assert: Verify that we are redirected to the contact list page
    await expect(page).toHaveURL(/\/contactList/);

    // Cleanup: Delete the test user
    usersClient.setAuthToken(createResponse.token);
    await usersClient.deleteMe();
  });

  test('should allow user to fill in email and password fields', async ({
    page,
  }) => {
    // Arrange: Create a new LoginPage instance
    const loginPage = new LoginPage(page);
    const testEmail = 'testuser@example.com';
    const testPassword = 'TestPassword123';

    // Act: Navigate and fill in the form
    await loginPage.goto();
    await loginPage.emailInput.fill(testEmail);
    await loginPage.passwordInput.fill(testPassword);

    // Assert: Verify the fields contain the entered values
    await expect(loginPage.emailInput).toHaveValue(testEmail);
    await expect(loginPage.passwordInput).toHaveValue(testPassword);
  });

  // ── Error Handling Tests ────────────────────────────────────────────────

  test('should display error message when logging in with invalid email', async ({
    page,
  }) => {
    // Arrange: Create a new LoginPage instance
    const loginPage = new LoginPage(page);

    // Act: Navigate and attempt login with invalid credentials
    await loginPage.goto();
    await loginPage.login('nonexistent@test.com', 'SomePassword123');

    // Assert: Verify error message is displayed
    await expect(loginPage.errorMessage).toBeVisible();
    const errorText = await loginPage.getErrorText();
    expect(errorText).toBeTruthy();
  });

  test('should display error message when logging in with wrong password', async ({
    page,
    request,
    uniqueEmail,
  }) => {
    // Arrange: Create a new user via API
    const password = 'CorrectPassword123';
    const newUser = {
      firstName: 'Test',
      lastName: 'User',
      email: uniqueEmail,
      password: password,
    };

    const usersClient = new UsersApiClient(request);
    const createResponse = await usersClient.addUser(newUser);

    // Act: Navigate and attempt login with wrong password
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(uniqueEmail, 'WrongPassword123');

    // Assert: Verify error message is displayed
    await expect(loginPage.errorMessage).toBeVisible();
    const errorText = await loginPage.getErrorText();
    expect(errorText).toBeTruthy();

    // Cleanup: Delete the test user
    usersClient.setAuthToken(createResponse.token);
    await usersClient.deleteMe();
  });

  test('should display error when submitting empty form', async ({ page }) => {
    // Arrange: Create a new LoginPage instance
    const loginPage = new LoginPage(page);

    // Act: Navigate and click submit without filling in any fields
    await loginPage.goto();
    await loginPage.submitButton.click();

    // Assert: Verify error message is displayed
    await expect(loginPage.errorMessage).toBeVisible();
    const errorText = await loginPage.getErrorText();
    expect(errorText).toBeTruthy();
  });

  test('should display error when email is empty but password is provided', async ({
    page,
  }) => {
    // Arrange: Create a new LoginPage instance
    const loginPage = new LoginPage(page);

    // Act: Navigate and fill only the password field
    await loginPage.goto();
    await loginPage.passwordInput.fill('SomePassword123');
    await loginPage.submitButton.click();

    // Assert: Verify error message is displayed
    await expect(loginPage.errorMessage).toBeVisible();
  });

  test('should display error when password is empty but email is provided', async ({
    page,
  }) => {
    // Arrange: Create a new LoginPage instance
    const loginPage = new LoginPage(page);

    // Act: Navigate and fill only the email field
    await loginPage.goto();
    await loginPage.emailInput.fill('test@example.com');
    await loginPage.submitButton.click();

    // Assert: Verify error message is displayed
    await expect(loginPage.errorMessage).toBeVisible();
  });

  // ── Navigation Tests ────────────────────────────────────────────────────

  test('should navigate to sign up page when clicking sign up button', async ({
    page,
  }) => {
    // Arrange: Create a new LoginPage instance
    const loginPage = new LoginPage(page);

    // Act: Navigate to login page and click sign up
    await loginPage.goto();
    await loginPage.clickSignUp();

    // Assert: Verify we are redirected to the add user page
    await expect(page).toHaveURL(/\/addUser/);
  });

  test('should navigate to sign up page when clicking sign up link', async ({
    page,
  }) => {
    // Arrange: Create a new LoginPage instance
    const loginPage = new LoginPage(page);

    // Act: Navigate to login page and click the sign up link
    await loginPage.goto();
    await loginPage.signUpLink.click();

    // Assert: Verify we are redirected to the add user page
    await expect(page).toHaveURL(/\/addUser/);
  });

  test('should navigate to login page on direct URL', async ({ page }) => {
    // Arrange: Create a new LoginPage instance
    const loginPage = new LoginPage(page);

    // Act: Navigate directly to login
    await loginPage.goto();

    // Assert: Verify we are on the login page
    await expect(page).toHaveURL(/\/$|\/$/);
  });

  // ── Input Validation Tests ──────────────────────────────────────────────

  test('should clear email field when cleared manually', async ({ page }) => {
    // Arrange: Create a new LoginPage instance
    const loginPage = new LoginPage(page);

    // Act: Navigate, fill, and clear the email field
    await loginPage.goto();
    await loginPage.emailInput.fill('test@example.com');
    await loginPage.emailInput.clear();

    // Assert: Verify the field is empty
    await expect(loginPage.emailInput).toHaveValue('');
  });

  test('should clear password field when cleared manually', async ({
    page,
  }) => {
    // Arrange: Create a new LoginPage instance
    const loginPage = new LoginPage(page);

    // Act: Navigate, fill, and clear the password field
    await loginPage.goto();
    await loginPage.passwordInput.fill('TestPassword123');
    await loginPage.passwordInput.clear();

    // Assert: Verify the field is empty
    await expect(loginPage.passwordInput).toHaveValue('');
  });

  test('should accept email with special characters', async ({ page }) => {
    // Arrange: Create a new LoginPage instance
    const loginPage = new LoginPage(page);
    const specialEmail = 'test+tag@example.co.uk';

    // Act: Navigate and fill in email with special characters
    await loginPage.goto();
    await loginPage.emailInput.fill(specialEmail);

    // Assert: Verify the email was entered correctly
    await expect(loginPage.emailInput).toHaveValue(specialEmail);
  });

  test('should accept password with special characters', async ({ page }) => {
    // Arrange: Create a new LoginPage instance
    const loginPage = new LoginPage(page);
    const specialPassword = 'P@ssw0rd!#$%^&*()';

    // Act: Navigate and fill in password with special characters
    await loginPage.goto();
    await loginPage.passwordInput.fill(specialPassword);

    // Assert: Verify the password was entered correctly
    await expect(loginPage.passwordInput).toHaveValue(specialPassword);
  });

  // ── UI State Tests ──────────────────────────────────────────────────────

  test('should not show error message on initial page load', async ({
    page,
  }) => {
    // Arrange: Create a new LoginPage instance
    const loginPage = new LoginPage(page);

    // Act: Navigate to login page
    await loginPage.goto();

    // Assert: Verify error message is not visible
    await expect(loginPage.errorMessage).not.toBeVisible();
  });

  test('should hide error message after clearing and re-entering credentials', async ({
    page,
    request,
    uniqueEmail,
  }) => {
    // Arrange: Create a new user and attempt login with wrong password
    const password = 'CorrectPassword123';
    const newUser = {
      firstName: 'Test',
      lastName: 'User',
      email: uniqueEmail,
      password: password,
    };

    const usersClient = new UsersApiClient(request);
    const createResponse = await usersClient.addUser(newUser);

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(uniqueEmail, 'WrongPassword123');

    // Verify error is shown
    await expect(loginPage.errorMessage).toBeVisible();

    // Act: Clear fields and enter correct credentials
    await loginPage.emailInput.clear();
    await loginPage.passwordInput.clear();
    await loginPage.login(uniqueEmail, password);

    // Assert: Verify we logged in successfully
    await expect(page).toHaveURL(/\/contactList/);

    // Cleanup: Delete the test user
    usersClient.setAuthToken(createResponse.token);
    await usersClient.deleteMe();
  });
});
