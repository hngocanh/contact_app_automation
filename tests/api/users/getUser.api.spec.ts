import { test, expect } from '@playwright/test';
import { UsersApiClient } from '@api/UserApiClient';

test.describe('GET /users/me — Get User Profile API', () => {
    // Store created user IDs and tokens for cleanup
    const createdUsers: Array<{ id: string; token: string }> = [];

    // Teardown: Delete all created users after each test
    test.afterEach(async ({ request }) => {
        for (const user of createdUsers) {
            try {
                const client = new UsersApiClient(request);
                client.setAuthToken(user.token);
                await client.deleteMe();
            } catch (error) {
                console.error(`Failed to delete user ${user.id}:`, error);
            }
        }
        createdUsers.length = 0;
    });

    // ── Happy Path Tests ───────────────────────────────────────────────────────

    test('returns user profile for authenticated user', async ({ request }) => {
        const client = new UsersApiClient(request);
        const loginRes = await client.login({
            email: process.env.TEST_USER_EMAIL!,
            password: process.env.TEST_USER_PASSWORD!,
        });

        client.setAuthToken(loginRes.token);
        const profileRes = await client.getProfile();

        // Verify response structure
        expect(profileRes).toHaveProperty('_id');
        expect(profileRes).toHaveProperty('firstName');
        expect(profileRes).toHaveProperty('lastName');
        expect(profileRes).toHaveProperty('email');
        expect(profileRes).toHaveProperty('__v');

        // Verify profile data matches logged-in user
        expect(profileRes.email).toBe(process.env.TEST_USER_EMAIL);
    });

    test('returns correct user data structure', async ({ request }) => {
        const uniqueEmail = `profile_${Date.now()}@example.com`;
        const newUser = {
            firstName: 'Profile',
            lastName: 'Test',
            email: uniqueEmail,
            password: 'Pass123',
        };

        const client = new UsersApiClient(request);
        const addRes = await client.addUser(newUser);
        createdUsers.push({ id: addRes.user._id, token: addRes.token });

        client.setAuthToken(addRes.token);
        const profileRes = await client.getProfile();

        // Verify all expected fields exist
        expect(profileRes).toHaveProperty('_id');
        expect(profileRes).toHaveProperty('firstName');
        expect(profileRes).toHaveProperty('lastName');
        expect(profileRes).toHaveProperty('email');
        expect(profileRes).toHaveProperty('__v');

        // Verify data types
        expect(typeof profileRes._id).toBe('string');
        expect(typeof profileRes.firstName).toBe('string');
        expect(typeof profileRes.lastName).toBe('string');
        expect(typeof profileRes.email).toBe('string');
        expect(typeof profileRes.__v).toBe('number');
    });

    test('returns profile data that matches the authenticated user', async ({ request }) => {
        const uniqueEmail = `match_${Date.now()}@example.com`;
        const newUser = {
            firstName: 'Match',
            lastName: 'User',
            email: uniqueEmail,
            password: 'Pass123',
        };

        const client = new UsersApiClient(request);
        const addRes = await client.addUser(newUser);
        createdUsers.push({ id: addRes.user._id, token: addRes.token });

        client.setAuthToken(addRes.token);
        const profileRes = await client.getProfile();

        // Verify profile matches created user
        expect(profileRes._id).toBe(addRes.user._id);
        expect(profileRes.firstName).toBe(newUser.firstName);
        expect(profileRes.lastName).toBe(newUser.lastName);
        expect(profileRes.email).toBe(newUser.email);
    });

    test('returns profile after login', async ({ request }) => {
        const uniqueEmail = `login_${Date.now()}@example.com`;
        const newUser = {
            firstName: 'Login',
            lastName: 'Test',
            email: uniqueEmail,
            password: 'Pass123',
        };

        const client = new UsersApiClient(request);
        const addRes = await client.addUser(newUser);
        createdUsers.push({ id: addRes.user._id, token: addRes.token });

        // Login with the new user
        const loginRes = await client.login({
            email: uniqueEmail,
            password: 'Pass123',
        });

        client.setAuthToken(loginRes.token);
        const profileRes = await client.getProfile();

        // Verify profile matches the logged-in user
        expect(profileRes.email).toBe(uniqueEmail);
        expect(profileRes.firstName).toBe(newUser.firstName);
        expect(profileRes.lastName).toBe(newUser.lastName);
    });

    // ── Negative Tests ─────────────────────────────────────────────────────────

    test('returns 401 when no token is provided', async ({ request }) => {
        const client = new UsersApiClient(request);
        // Don't set auth token
        const res = await client.rawGetProfile();
        expect(res.status()).toBe(401);
    });

    test('returns 401 when invalid token is provided', async ({ request }) => {
        const client = new UsersApiClient(request);
        client.setAuthToken('invalid.token.here');
        const res = await client.rawGetProfile();
        expect(res.status()).toBe(401);
    });

    test('returns 401 when expired token is provided', async ({ request }) => {
        const client = new UsersApiClient(request);
        // Use a malformed/expired-looking token
        const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.expired.token';
        client.setAuthToken(expiredToken);
        const res = await client.rawGetProfile();
        expect(res.status()).toBe(401);
    });

    test('returns 401 when token is empty string', async ({ request }) => {
        const client = new UsersApiClient(request);
        client.setAuthToken('');
        const res = await client.rawGetProfile();
        expect(res.status()).toBe(401);
    });
});