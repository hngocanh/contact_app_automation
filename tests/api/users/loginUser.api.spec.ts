import { test, expect } from '@playwright/test';
import { UsersApiClient } from '@api/UserApiClient';


test.describe('POST /users/login — Login User API', () => {
    // ── Happy Path Tests ───────────────────────────────────────────────────────

    test('returns token and user data for valid credentials', async ({ request }) => {
        const client = new UsersApiClient(request);
        const res = await client.login({
            email: process.env.TEST_USER_EMAIL!,
            password: process.env.TEST_USER_PASSWORD!,
        });

        // Verify response structure
        expect(res).toHaveProperty('token');
        expect(res).toHaveProperty('user');

        // Verify token is a non-empty string
        expect(typeof res.token).toBe('string');
        expect(res.token.length).toBeGreaterThan(0);

        // Verify user object structure
        expect(res.user).toHaveProperty('_id');
        expect(res.user).toHaveProperty('firstName');
        expect(res.user).toHaveProperty('lastName');
        expect(res.user).toHaveProperty('email');
        expect(res.user).toHaveProperty('__v');

        // Verify user email matches request
        expect(res.user.email).toBe(process.env.TEST_USER_EMAIL);
    });

    // ── Negative Tests ─────────────────────────────────────────────────────────

    test('returns 401 for wrong password', async ({ request }) => {
        const client = new UsersApiClient(request);
        const res = await client.rawLogin({
            email: process.env.TEST_USER_EMAIL!,
            password: 'wrongpassword',
        });
        expect(res.status()).toBe(401);
    });

    test('returns 401 for non-existent user', async ({ request }) => {
        const client = new UsersApiClient(request);
        const res = await client.rawLogin({
            email: 'nonexistent@example.com',
            password: 'anypassword',
        });
        expect(res.status()).toBe(401);
    });

    test('returns 401 when email is missing', async ({ request }) => {
        const client = new UsersApiClient(request);
        const res = await client.rawLogin({
            password: 'somepassword',
        });
        expect(res.status()).toBe(401);
    });

    test('returns 401 when password is missing', async ({ request }) => {
        const client = new UsersApiClient(request);
        const res = await client.rawLogin({
            email: 'test@example.com',
        });
        expect(res.status()).toBe(401);
    });

    test('returns 401 when email is empty string', async ({ request }) => {
        const client = new UsersApiClient(request);
        const res = await client.rawLogin({
            email: '',
            password: 'somepassword',
        });
        expect(res.status()).toBe(401);
    });

    test('returns 401 when password is empty string', async ({ request }) => {
        const client = new UsersApiClient(request);
        const res = await client.rawLogin({
            email: 'test@example.com',
            password: '',
        });
        expect(res.status()).toBe(401);
    });

    test('returns 401 for invalid email format', async ({ request }) => {
        const client = new UsersApiClient(request);
        const res = await client.rawLogin({
            email: 'invalid-email',
            password: 'somepassword',
        });
        expect(res.status()).toBe(401);
    });

    test('returns 401 when both email and password are missing', async ({ request }) => {
        const client = new UsersApiClient(request);
        const res = await client.rawLogin({});
        expect(res.status()).toBe(401);
    });
});
