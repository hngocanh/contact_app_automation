import { test, expect } from '@playwright/test';
import { UsersApiClient } from '@api/UserApiClient';


test.describe('Auth API', () => {
    test('POST /auth/login — returns token for valid credentials', async ({ request }) => {
        const client = new UsersApiClient(request);
        const res = await client.login({
            email: process.env.TEST_USER_EMAIL!,
            password: process.env.TEST_USER_PASSWORD!,
        });
        expect(res.token).toBeTruthy();
        expect(res.user.email).toBe(process.env.TEST_USER_EMAIL);
    });

    test('POST /auth/login — returns 401 for wrong password', async ({ request }) => {
        const client = new UsersApiClient(request);
        const res = await client.rawLogin({ email: 'wrong@example.com', password: 'bad' });
        expect(res.status()).toBe(401);
    });
});
