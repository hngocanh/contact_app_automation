import { test, expect } from '@fixtures/fixtures';
import { UsersApiClient } from '@api/UserApiClient'
import { makeUniqueEmail } from '@utils/testHelpers';

test.describe('PUT /users/me — Update User Profile API', () => {
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

    // ── HAPPY PATH: Successful updates ──────────────────────────────────

    test('allows updating all user profile fields at once', async ({ request, uniqueEmail }) => {
        // Create a new user for testing (uniqueEmail provided by fixture)
        const newUser = {
            firstName: 'John',
            lastName: 'Doe',
            email: uniqueEmail,
            password: 'Pass123',
        };

        const client = new UsersApiClient(request);
        const addRes = await client.addUser(newUser);
        createdUsers.push({ id: addRes.user._id, token: addRes.token });

        // Set auth token for the new user
        client.setAuthToken(addRes.token);

        // Update all fields with unique email
        const updateData = {
            firstName: 'Jane',
            lastName: 'Smith',
            email: makeUniqueEmail('updated'), // Ensure new unique email for update
            password: 'NewPass456',
        };
        const res = await client.updateProfile(updateData);

        // Verify response structure
        expect(res).toHaveProperty('_id');
        expect(res).toHaveProperty('firstName');
        expect(res).toHaveProperty('lastName');
        expect(res).toHaveProperty('email');
        expect(res).toHaveProperty('__v');

        // Verify all fields were updated
        expect(res.firstName).toBe(updateData.firstName);
        expect(res.lastName).toBe(updateData.lastName);
        expect(res.email).toBe(updateData.email);
    });

    test('allows updating only firstName', async ({ request, uniqueEmail }) => {
        // Create a new user (uniqueEmail provided by fixture)
        const newUser = {
            firstName: 'FirstName',
            lastName: 'LastName',
            email: uniqueEmail,
            password: 'Pass123',
        };

        const client = new UsersApiClient(request);
        const addRes = await client.addUser(newUser);
        createdUsers.push({ id: addRes.user._id, token: addRes.token });
        client.setAuthToken(addRes.token);

        // Update only firstName
        const updateData = { firstName: 'UpdatedFirstName' };
        const res = await client.updateProfile(updateData);

        // Verify firstName was updated
        expect(res.firstName).toBe(updateData.firstName);
        // Verify other fields stayed the same
        expect(res.lastName).toBe(newUser.lastName);
        expect(res.email).toBe(newUser.email);
    });

    test('allows updating only lastName', async ({ request, uniqueEmail }) => {
        const newUser = {
            firstName: 'FirstName',
            lastName: 'LastName',
            email: uniqueEmail,
            password: 'Pass123',
        };

        const client = new UsersApiClient(request);
        const addRes = await client.addUser(newUser);
        createdUsers.push({ id: addRes.user._id, token: addRes.token });
        client.setAuthToken(addRes.token);

        // Update only lastName
        const updateData = { lastName: 'UpdatedLastName' };
        const res = await client.updateProfile(updateData);

        // Verify lastName was updated
        expect(res.lastName).toBe(updateData.lastName);
        // Verify other fields stayed the same
        expect(res.firstName).toBe(newUser.firstName);
        expect(res.email).toBe(newUser.email);
    });

    test('allows updating only email', async ({ request, uniqueEmail }) => {
        const newUser = {
            firstName: 'FirstName',
            lastName: 'LastName',
            email: uniqueEmail,
            password: 'Pass123',
        };

        const client = new UsersApiClient(request);
        const addRes = await client.addUser(newUser);
        createdUsers.push({ id: addRes.user._id, token: addRes.token });
        client.setAuthToken(addRes.token);

        // Update only email
        const newEmail = makeUniqueEmail('updated');
        const updateData = { email: newEmail };
        const res = await client.updateProfile(updateData);

        // Verify email was updated
        expect(res.email).toBe(newEmail);
        // Verify other fields stayed the same
        expect(res.firstName).toBe(newUser.firstName);
        expect(res.lastName).toBe(newUser.lastName);
    });

    test('allows updating only password', async ({ request, uniqueEmail }) => {
        const newUser = {
            firstName: 'FirstName',
            lastName: 'LastName',
            email: uniqueEmail,
            password: 'OldPass123',
        };

        const client = new UsersApiClient(request);
        const addRes = await client.addUser(newUser);
        createdUsers.push({ id: addRes.user._id, token: addRes.token });
        client.setAuthToken(addRes.token);

        // Update only password
        const updateData = { password: 'NewPass456' };
        const res = await client.updateProfile(updateData);

        // Verify response (password is not returned)
        expect(res).toHaveProperty('_id');
        expect(res).toHaveProperty('firstName');
        expect(res).toHaveProperty('lastName');
        expect(res).toHaveProperty('email');
        // Verify other fields stayed the same (unchanged)
        expect(res.firstName).toBe(newUser.firstName);
        expect(res.lastName).toBe(newUser.lastName);
        expect(res.email).toBe(newUser.email);
    });

    test('allows updating firstName and lastName together', async ({ request, uniqueEmail }) => {
        const newUser = {
            firstName: 'FirstName',
            lastName: 'LastName',
            email: uniqueEmail,
            password: 'Pass123',
        };

        const client = new UsersApiClient(request);
        const addRes = await client.addUser(newUser);
        createdUsers.push({ id: addRes.user._id, token: addRes.token });
        client.setAuthToken(addRes.token);

        // Update both firstName and lastName
        const updateData = {
            firstName: 'NewFirst',
            lastName: 'NewLast',
        };
        const res = await client.updateProfile(updateData);

        // Verify both were updated
        expect(res.firstName).toBe(updateData.firstName);
        expect(res.lastName).toBe(updateData.lastName);
        // Verify email stayed the same
        expect(res.email).toBe(newUser.email);
    });

    test('allows updating with special characters in firstName and lastName', async ({ request, uniqueEmail }) => {
        const newUser = {
            firstName: 'John',
            lastName: 'Doe',
            email: uniqueEmail,
            password: 'Pass123',
        };

        const client = new UsersApiClient(request);
        const addRes = await client.addUser(newUser);
        createdUsers.push({ id: addRes.user._id, token: addRes.token });
        client.setAuthToken(addRes.token);

        // Update with special characters
        const updateData = {
            firstName: "Jean-Marie",
            lastName: "O'Connor-Smith",
        };
        const res = await client.updateProfile(updateData);

        // Verify special characters were preserved
        expect(res.firstName).toBe(updateData.firstName);
        expect(res.lastName).toBe(updateData.lastName);
    });

    // ── NEGATIVE TESTS: Authentication failures ──────────────────────────────

    test('returns 401 when updating without authentication token', async ({ request }) => {
        const client = new UsersApiClient(request);
        // Do NOT set auth token
        const updateData = { firstName: 'Updated' };

        const res = await client.rawUpdateProfile(updateData);

        // Verify 401 Unauthorized
        expect(res.status()).toBe(401);
    });

    test('returns 401 when updating with invalid/expired token', async ({ request }) => {
        const client = new UsersApiClient(request);
        // Set a fake/invalid token
        client.setAuthToken('invalid.token.here');

        const updateData = { firstName: 'Updated' };
        const res = await client.rawUpdateProfile(updateData);

        // Verify 401 Unauthorized
        expect(res.status()).toBe(401);
    });

    test('returns 401 when updating with empty token', async ({ request }) => {
        const client = new UsersApiClient(request);
        // Set an empty token
        client.setAuthToken('');

        const updateData = { firstName: 'Updated' };
        const res = await client.rawUpdateProfile(updateData);

        // Verify 401 Unauthorized
        expect(res.status()).toBe(401);
    });

    // ── NEGATIVE TESTS: Invalid data ─────────────────────────────────────────

    test('returns 400 when updating with empty firstName', async ({ request, uniqueEmail }) => {
        // Create a new user first (uniqueEmail provided by fixture)
        const newUser = {
            firstName: 'John',
            lastName: 'Doe',
            email: uniqueEmail,
            password: 'Pass123',
        };

        const client = new UsersApiClient(request);
        const addRes = await client.addUser(newUser);
        createdUsers.push({ id: addRes.user._id, token: addRes.token });
        client.setAuthToken(addRes.token);

        // Try to update with empty firstName
        const updateData = { firstName: '' };
        const res = await client.rawUpdateProfile(updateData);

        // Verify 400 Bad Request
        expect(res.status()).toBe(400);
    });

    test('returns 400 when updating with empty lastName', async ({ request, uniqueEmail }) => {
        const newUser = {
            firstName: 'John',
            lastName: 'Doe',
            email: uniqueEmail,
            password: 'Pass123',
        };

        const client = new UsersApiClient(request);
        const addRes = await client.addUser(newUser);
        createdUsers.push({ id: addRes.user._id, token: addRes.token });
        client.setAuthToken(addRes.token);

        // Try to update with empty lastName
        const updateData = { lastName: '' };
        const res = await client.rawUpdateProfile(updateData);

        // Verify 400 Bad Request
        expect(res.status()).toBe(400);
    });

    test('returns 400 when updating with invalid email format', async ({ request, uniqueEmail }) => {
        const newUser = {
            firstName: 'John',
            lastName: 'Doe',
            email: uniqueEmail,
            password: 'Pass123',
        };

        const client = new UsersApiClient(request);
        const addRes = await client.addUser(newUser);
        createdUsers.push({ id: addRes.user._id, token: addRes.token });
        client.setAuthToken(addRes.token);

        // Try to update with invalid email (no @ symbol)
        const updateData = { email: 'notanemail' };
        const res = await client.rawUpdateProfile(updateData);

        // Verify 400 Bad Request
        expect(res.status()).toBe(400);
    });

    test('returns 400 when updating with empty email', async ({ request, uniqueEmail }) => {
        const newUser = {
            firstName: 'John',
            lastName: 'Doe',
            email: uniqueEmail,
            password: 'Pass123',
        };

        const client = new UsersApiClient(request);
        const addRes = await client.addUser(newUser);
        createdUsers.push({ id: addRes.user._id, token: addRes.token });
        client.setAuthToken(addRes.token);

        // Try to update with empty email
        const updateData = { email: '' };
        const res = await client.rawUpdateProfile(updateData);

        // Verify 400 Bad Request
        expect(res.status()).toBe(400);
    });

    test('returns 400 when updating with empty password', async ({ request, uniqueEmail }) => {
        const newUser = {
            firstName: 'John',
            lastName: 'Doe',
            email: uniqueEmail,
            password: 'Pass123',
        };

        const client = new UsersApiClient(request);
        const addRes = await client.addUser(newUser);
        createdUsers.push({ id: addRes.user._id, token: addRes.token });
        client.setAuthToken(addRes.token);

        // Try to update with empty password
        const updateData = { password: '' };
        const res = await client.rawUpdateProfile(updateData);

        // Verify 400 Bad Request
        expect(res.status()).toBe(400);
    });

    test('returns 400 when updating to an email that already exists', async ({ request, uniqueEmail }) => {
        // Create first user (use fixture for one email)
        const uniqueEmail1 = uniqueEmail;
        const user1 = {
            firstName: 'User',
            lastName: 'One',
            email: uniqueEmail1,
            password: 'Pass123',
        };

        const client = new UsersApiClient(request);
        const addRes1 = await client.addUser(user1);
        createdUsers.push({ id: addRes1.user._id, token: addRes1.token });

        // Create second user
        const uniqueEmail2 = makeUniqueEmail();
        const user2 = {
            firstName: 'User',
            lastName: 'Two',
            email: uniqueEmail2,
            password: 'Pass123',
        };

        const addRes2 = await client.addUser(user2);
        createdUsers.push({ id: addRes2.user._id, token: addRes2.token });
        client.setAuthToken(addRes2.token);

        // Try to update user2's email to user1's email (should fail)
        const updateData = { email: uniqueEmail1 };
        const res = await client.rawUpdateProfile(updateData);

        // Verify 400 Bad Request (email already in use)
        expect(res.status()).toBe(400);
    });
});