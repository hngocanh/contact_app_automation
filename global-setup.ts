import { request } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * global-setup.ts
 *
 * Runs ONCE before the entire test suite (configured via `globalSetup` in
 * playwright.config.ts).
 *
 * What it does:
 *   1. Calls POST /users/login with the credentials from .env
 *   2. Extracts the JWT token from the response
 *   3. Writes { token, user } to disk at AUTH_STATE_PATH
 *
 * Why save to disk instead of using Playwright's storageState?
 *   This app uses JWT in the Authorization header, not a browser cookie.
 *   storageState captures cookies/localStorage — it has nothing to capture here.
 *   Saving the token to a JSON file lets both API tests and UI tests (via
 *   localStorage injection or request interception) reuse the same session.
 *
 * Tests read the token via the `authState` fixture defined in fixtures.ts.
 */
export default async function globalSetup(): Promise<void> {
  const baseURL  = process.env.BASE_URL  ?? 'https://thinking-tester-contact-list.herokuapp.com';
  const email    = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;
  const statePath = process.env.AUTH_STATE_PATH ?? 'test-results/.auth/state.json';

  if (!email || !password) {
    throw new Error(
      'TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in your .env file.\n' +
      'Copy .env.example to .env and fill in your credentials.'
    );
  }

  // Create the output directory if it doesn't exist
  fs.mkdirSync(path.dirname(statePath), { recursive: true });

  // Use Playwright's API request context (no browser needed)
  const apiContext = await request.newContext({ baseURL });

  const response = await apiContext.post('/users/login', {
    data: { email, password },
  });

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(
      `global-setup: login failed (${response.status()})\n${body}\n\n` +
      'Make sure TEST_USER_EMAIL and TEST_USER_PASSWORD in .env are correct, ' +
      'and that the account exists on the app.'
    );
  }

  const { token, user } = await response.json();

  // Persist to disk — tests will read this via the authState fixture
  fs.writeFileSync(statePath, JSON.stringify({ token, user }, null, 2));

  console.log(`\n  global-setup: logged in as ${user.email}, token saved to ${statePath}\n`);

  await apiContext.dispose();
}