import { test as base, Page } from '@playwright/test';
import * as fs from 'fs';
import { LoginPage } from '../pages/LoginPage';
import { UsersApiClient } from '../api/UserApiClient';
import { ContactsApiClient } from '../api/ContactsApiClient';
import { User } from '../types/api.types';

interface AuthState {
  token: string;
  user:  User;
}

type CustomFixtures = {
  /** Token + user object written by global-setup. Use to authenticate clients. */
  authState:          AuthState;
  loginPage:          LoginPage;
  /** UsersApiClient pre-authenticated with the token from global-setup. */
  usersApiClient:     UsersApiClient;
  /** ContactsApiClient pre-authenticated with the token from global-setup. */
  contactsApiClient:  ContactsApiClient;
  /** A browser page with the JWT already injected into localStorage. */
  authenticatedPage:  Page;
};

/**
 * Extended test — import this instead of '@playwright/test' in all spec files.
 */
export const test = base.extend<CustomFixtures>({

  // Reads the token file written by global-setup once per worker
  authState: async ({}, use) => {
    const statePath = process.env.AUTH_STATE_PATH ?? 'test-results/.auth/state.json';
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