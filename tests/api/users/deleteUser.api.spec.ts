import { test, expect } from '@fixtures/fixtures';
import { UsersApiClient } from '@api/UserApiClient';

test.describe('DELETE /users/me — Delete User API', () => {
    // Store created user IDs and tokens for cleanup
    const createdUsers: Array<{ id: string; token: string }> = [];

    // Teardown: Delete all created users after each test
    // Note: Some tests intentionally delete users, so we catch errors gracefully
    test.afterEach(async ({ request }) => {
        for (const user of createdUsers) {
            try {
                const client = new UsersApiClient(request);
                client.setAuthToken(user.token);
                await client.deleteMe();
            } catch (error) {
                // User may already be deleted by the test, so we ignore this error
                console.log(`User ${user.id} already deleted or cleanup not needed`);
            }
        }
        createdUsers.length = 0;
    });

    // ── HAPPY PATH: Successful deletions ────────────────────────────────────

    test('successfully deletes the authenticated user', async ({ request, uniqueEmail }) => {
        // Create a new user to delete (uniqueEmail provided by fixture)
        const newUser = {
            firstName: 'Delete',
            lastName: 'Test',
            email: uniqueEmail,
            password: 'DeletePass123',
        };

        const client = new UsersApiClient(request);
        const addRes = await client.addUser(newUser);
        createdUsers.push({ id: addRes.user._id, token: addRes.token });
        client.setAuthToken(addRes.token);

        // Delete the user
        await client.deleteMe();

        // Attempt to access a protected endpoint to verify deletion
        const profileRes = await client.rawGetProfile();
        expect(profileRes.status()).toBe(401); // Expect unauthorized after deletion
    });

    test('deleted user cannot login with previous password', async ({ request, uniqueEmail }) => {
        // Create a user (uniqueEmail provided by fixture)
        const password = 'TestPass123';
        const newUser = {
            firstName: 'NoLogin',
            lastName: 'User',
            email: uniqueEmail,
            password: password,
        };

        const client = new UsersApiClient(request);
        const addRes = await client.addUser(newUser);
        createdUsers.push({ id: addRes.user._id, token: addRes.token });
        client.setAuthToken(addRes.token);

        // Delete the user
        await client.deleteMe();

        // Try to login with the deleted user's credentials
        const loginRes = await client.rawLogin({
            email: uniqueEmail,
            password: password,
        });

        // Should fail with 401 (user no longer exists)
        expect(loginRes.status()).toBe(401);
    });

    test('deleted user profile is no longer accessible', async ({ request, uniqueEmail }) => {
        // Create a user (uniqueEmail provided by fixture)
        const newUser = {
            firstName: 'NoProfile',
            lastName: 'User',
            email: uniqueEmail,
            password: 'Pass123',
        };

        const client = new UsersApiClient(request);
        const addRes = await client.addUser(newUser);
        const userId = addRes.user._id;
        createdUsers.push({ id: userId, token: addRes.token });
        client.setAuthToken(addRes.token);

        // Get profile before deletion
        const profileBefore = await client.getProfile();
        expect(profileBefore._id).toBe(userId);

        // Delete the user
        await client.deleteMe();

        // Try to get profile after deletion
        const profileAfter = await client.rawGetProfile();
        expect(profileAfter.status()).toBe(401);
    });

    test('same email can be reused after user deletion', async ({ request, uniqueEmail }) => {
        const sharedEmail = uniqueEmail;

        const client = new UsersApiClient(request);

        // Create first user with email
        const user1 = {
            firstName: 'First',
            lastName: 'User',
            email: sharedEmail,
            password: 'Pass123',
        };
        const addRes1 = await client.addUser(user1);
        createdUsers.push({ id: addRes1.user._id, token: addRes1.token });
        client.setAuthToken(addRes1.token);

        // Delete first user
        await client.deleteMe();

        // Create second user with the SAME email (should succeed)
        const user2 = {
            firstName: 'Second',
            lastName: 'User',
            email: sharedEmail,
            password: 'NewPass456',
        };
        const addRes2 = await client.addUser(user2);
        createdUsers.push({ id: addRes2.user._id, token: addRes2.token });

        // Verify second user was created successfully
        expect(addRes2.user.email).toBe(sharedEmail);
        expect(addRes2.user._id).not.toBe(addRes1.user._id); // Different users
    });

    // ── NEGATIVE TESTS: Authentication failures ────────────────────────────────

    test('returns 401 when deleting without authentication token', async ({ request }) => {
        const client = new UsersApiClient(request);
        // Do NOT set auth token

        const res = await client.rawDeleteMe();

        // Verify 401 Unauthorized
        expect(res.status()).toBe(401);
    });

    test('returns 401 when deleting with invalid/expired token', async ({ request }) => {
        const client = new UsersApiClient(request);
        // Set a fake/invalid token
        client.setAuthToken('invalid.token.here');

        const res = await client.rawDeleteMe();

        // Verify 401 Unauthorized
        expect(res.status()).toBe(401);
    });

    test('returns 401 when deleting with empty token', async ({ request }) => {
        const client = new UsersApiClient(request);
        // Set an empty token
        client.setAuthToken('');

        const res = await client.rawDeleteMe();

        // Verify 401 Unauthorized
        expect(res.status()).toBe(401);
    });

    // ── EDGE CASES ──────────────────────────────────────────────────────────

    test('cannot delete the same user twice', async ({ request, uniqueEmail }) => {
        // Create a user (uniqueEmail provided by fixture)
        const newUser = {
            firstName: 'Double',
            lastName: 'Delete',
            email: uniqueEmail,
            password: 'Pass123',
        };

        const client = new UsersApiClient(request);
        const addRes = await client.addUser(newUser);
        createdUsers.push({ id: addRes.user._id, token: addRes.token });
        client.setAuthToken(addRes.token);

        // Delete the user (first time)
        await client.deleteMe();

        // Try to delete the same user again (should fail with 401)
        const secondDeleteRes = await client.rawDeleteMe();
        expect(secondDeleteRes.status()).toBe(401);
    });

    test('deletion response status is 200', async ({ request, uniqueEmail }) => {
        // Create a user (uniqueEmail provided by fixture)
        const newUser = {
            firstName: 'Status',
            lastName: 'Check',
            email: uniqueEmail,
            password: 'Pass123',
        };

        const client = new UsersApiClient(request);
        const addRes = await client.addUser(newUser);
        createdUsers.push({ id: addRes.user._id, token: addRes.token });
        client.setAuthToken(addRes.token);

        // Delete and verify status code
        const deleteRes = await client.rawDeleteMe();
        expect(deleteRes.status()).toBe(200);
    });

    test('old token cannot be reused after user deletion', async ({ request, uniqueEmail }) => {
        // Create a user (uniqueEmail provided by fixture)
        const newUser = {
            firstName: 'Token',
            lastName: 'Reuse',
            email: uniqueEmail,
            password: 'Pass123',
        };

        const client = new UsersApiClient(request);
        const addRes = await client.addUser(newUser);
        const userToken = addRes.token;
        createdUsers.push({ id: addRes.user._id, token: userToken });
        client.setAuthToken(userToken);

        // Delete the user
        await client.deleteMe();

        // Try to use the old token to access protected endpoint
        const client2 = new UsersApiClient(request);
        client2.setAuthToken(userToken);
        const profileRes = await client2.rawGetProfile();

        // Should fail with 401 (token no longer valid)
        expect(profileRes.status()).toBe(401);
    });
});