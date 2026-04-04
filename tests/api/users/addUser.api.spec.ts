import { test, expect } from '../../../fixtures/fixtures';
import { UsersApiClient } from '@api/UserApiClient';
import { makeUniqueEmail } from '../../../utils/testHelpers';

test.describe('POST /users — Add User API', () => {
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
                // Log error but don't fail the test if cleanup fails
                console.error(`Failed to delete user ${user.id}:`, error);
            }
        }
        // Clear the array after cleanup
        createdUsers.length = 0;
    });

    // ── Happy Path Tests ───────────────────────────────────────────────────────

    test('successfully adds a new user with valid data', async ({ request, uniqueEmail }) => {
        const newUser = {
            firstName: 'Test',
            lastName: 'User',
            email: uniqueEmail,
            password: 'TestPassword123',
        };

        const client = new UsersApiClient(request);
        const res = await client.addUser(newUser);

        // Store user info for cleanup
        createdUsers.push({ id: res.user._id, token: res.token });

        // Verify response structure
        expect(res).toHaveProperty('user');
        expect(res).toHaveProperty('token');

        // Verify user object structure
        expect(res.user).toHaveProperty('_id');
        expect(res.user).toHaveProperty('firstName', newUser.firstName);
        expect(res.user).toHaveProperty('lastName', newUser.lastName);
        expect(res.user).toHaveProperty('email', newUser.email);
        expect(res.user).toHaveProperty('__v');

        // Verify token is a non-empty string
        expect(typeof res.token).toBe('string');
        expect(res.token.length).toBeGreaterThan(0);
    });

    test('creates user with minimal valid data', async ({ request, uniqueEmail }) => {
        const newUser = {
            firstName: 'Min',
            lastName: 'User',
            email: uniqueEmail,
            password: 'Pass123',
        };

        const client = new UsersApiClient(request);
        const res = await client.addUser(newUser);

        createdUsers.push({ id: res.user._id, token: res.token });

        expect(res.user.firstName).toBe(newUser.firstName);
        expect(res.user.lastName).toBe(newUser.lastName);
        expect(res.user.email).toBe(newUser.email);
    });

    test('creates user with special characters in name', async ({ request, uniqueEmail }) => {
        const newUser = {
            firstName: "O'Connor",
            lastName: 'Smith-Jones',
            email: uniqueEmail,
            password: 'Pass123',
        };

        const client = new UsersApiClient(request);
        const res = await client.addUser(newUser);

        createdUsers.push({ id: res.user._id, token: res.token });

        expect(res.user.firstName).toBe(newUser.firstName);
        expect(res.user.lastName).toBe(newUser.lastName);
    });

    // ── Negative Tests ─────────────────────────────────────────────────────────

    test('returns 400 when firstName is missing', async ({ request }) => {
        const client = new UsersApiClient(request);
        const res = await client.rawAddUser({
            lastName: 'User',
            email: makeUniqueEmail('bad'),
            password: 'Pass123',
        });
        expect(res.status()).toBe(400);
    });

    test('returns 400 when lastName is missing', async ({ request }) => {
        const client = new UsersApiClient(request);
        const res = await client.rawAddUser({
            firstName: 'Test',
            email: makeUniqueEmail('bad'),
            password: 'Pass123',
        });
        expect(res.status()).toBe(400);
    });

    test('returns 400 when email is missing', async ({ request }) => {
        const client = new UsersApiClient(request);
        const res = await client.rawAddUser({
            firstName: 'Test',
            lastName: 'User',
            password: 'Pass123',
        });
        expect(res.status()).toBe(400);
    });

    test('returns 400 when password is missing', async ({ request }) => {
        const client = new UsersApiClient(request);
        const res = await client.rawAddUser({
            firstName: 'Test',
            lastName: 'User',
            email: makeUniqueEmail('bad'),
        });
        expect(res.status()).toBe(400);
    });

    test('returns 400 when firstName is empty string', async ({ request }) => {
        const client = new UsersApiClient(request);
        const res = await client.rawAddUser({
            firstName: '',
            lastName: 'User',
            email: makeUniqueEmail('bad'),
            password: 'Pass123',
        });
        expect(res.status()).toBe(400);
    });

    test('returns 400 when lastName is empty string', async ({ request }) => {
        const client = new UsersApiClient(request);
        const res = await client.rawAddUser({
            firstName: 'Test',
            lastName: '',
            email: makeUniqueEmail('bad'),
            password: 'Pass123',
        });
        expect(res.status()).toBe(400);
    });

    test('returns 400 when email is empty string', async ({ request }) => {
        const client = new UsersApiClient(request);
        const res = await client.rawAddUser({
            firstName: 'Test',
            lastName: 'User',
            email: '',
            password: 'Pass123',
        });
        expect(res.status()).toBe(400);
    });

    test('returns 400 when password is empty string', async ({ request }) => {
        const client = new UsersApiClient(request);
        const res = await client.rawAddUser({
            firstName: 'Test',
            lastName: 'User',
            email: makeUniqueEmail('bad'),
            password: '',
        });
        expect(res.status()).toBe(400);
    });

    test('returns 400 for invalid email format', async ({ request }) => {
        const client = new UsersApiClient(request);
        const res = await client.rawAddUser({
            firstName: 'Test',
            lastName: 'User',
            email: 'invalid-email',
            password: 'Pass123',
        });
        expect(res.status()).toBe(400);
    });

    test('returns 400 when all fields are missing', async ({ request }) => {
        const client = new UsersApiClient(request);
        const res = await client.rawAddUser({});
        expect(res.status()).toBe(400);
    });

    test('returns 400 when email already exists', async ({ request, uniqueEmail }) => {
        const newUser = {
            firstName: 'Test',
            lastName: 'User',
            email: uniqueEmail,
            password: 'Pass123',
        };

        const client = new UsersApiClient(request);

        // Create first user
        const res1 = await client.addUser(newUser);
        createdUsers.push({ id: res1.user._id, token: res1.token });

        // Try to create second user with same email
        const res2 = await client.rawAddUser(newUser);
        expect(res2.status()).toBe(400);
    });
});