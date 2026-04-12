import { test as base, Page } from '@playwright/test';
import * as fs from 'fs';
import { LoginPage } from '../pages/LoginPage';
import { UsersApiClient } from '../api/UserApiClient';
import { ContactsApiClient } from '../api/ContactsApiClient';
import { makeUniqueEmail } from '../utils/testHelpers';
import { User } from '../types/api.types';

interface AuthState {
  token: string;
  user: User;
}

type CustomFixtures = {
  /** Token + user object written by global-setup. Use to authenticate clients. */
  authState: AuthState;
  loginPage: LoginPage;
  /** UsersApiClient pre-authenticated with the token from global-setup. */
  usersApiClient: UsersApiClient;
  /** ContactsApiClient pre-authenticated with the token from global-setup. */
  contactsApiClient: ContactsApiClient;
  /** A browser page with the JWT already injected into localStorage. */
  authenticatedPage: Page;
  /** A unique email string generated per-test to avoid duplication */
  uniqueEmail: string;
};

/**
 * Extended test — import this instead of '@playwright/test' in all spec files.
 */
export const test = base.extend<CustomFixtures>({

  // Reads the token file written by global-setup once per worker
  authState: async ({ }, use) => {

    const statePath = process.env.AUTH_STATE_PATH ?? 'test-results/.auth/state.json';

    // If the global-setup did not run or the file was removed, provide
    // a clear, actionable error instead of letting readFileSync throw.
    if (!fs.existsSync(statePath)) {
      throw new Error(
        `auth state file not found at "${statePath}". Ensure global-setup ran successfully and wrote the file.\n` +
        `Make sure TEST_USER_EMAIL and TEST_USER_PASSWORD are set in your .env and that AUTH_STATE_PATH (if used) is correct.`
      );
    }

    const raw = fs.readFileSync(statePath, 'utf-8');
    await use(JSON.parse(raw) as AuthState);
  },

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  // Pre-authenticated — token is injected automatically
  usersApiClient: async ({ request, authState }, use) => {
    const client = new UsersApiClient(request);
    client.setAuthToken(authState.token);
    await use(client);
  },

  // Pre-authenticated — token is injected automatically
  contactsApiClient: async ({ request, authState }, use) => {
    const client = new ContactsApiClient(request);
    client.setAuthToken(authState.token);
    await use(client);
  },

  // Per-test unique email helper to avoid repeating makeUniqueEmail() in every spec
  uniqueEmail: async ({ }, use) => {
    await use(makeUniqueEmail());
  },

  // Injects the JWT into localStorage so the app treats the browser as logged in
  authenticatedPage: async ({ page, authState }, use) => {
    await page.goto('/');
    await page.evaluate((token) => {
      localStorage.setItem('token', token);
    }, authState.token);
    await use(page);
  },
});

export { expect } from '@playwright/test';