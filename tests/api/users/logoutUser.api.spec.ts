import {test, expect} from '@playwright/test';
import { UsersApiClient } from '@api/UserApiClient';

test.describe('POST /users/logout — Logout User API', () => {
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

    test('successfully logs out an authenticated user', async ({ request }) => {
        // Create a new user to log in and then log out
        const uniqueEmail = `logout_${Date.now()}@example.com`;
        const newUser = {
            firstName: 'Logout',
            lastName: 'Test',
            email: uniqueEmail,
            password: 'LogoutPass123',
        };

        const client = new UsersApiClient(request);
        const addRes = await client.addUser(newUser);
        createdUsers.push({ id: addRes.user._id, token: addRes.token });
        client.setAuthToken(addRes.token);

        // Log out the user
        await client.logout();

        // Attempt to access a protected endpoint to verify logout
        const profileRes = await client.rawGetProfile();
        expect(profileRes.status()).toBe(401); // Expect unauthorized after logout
    });
});