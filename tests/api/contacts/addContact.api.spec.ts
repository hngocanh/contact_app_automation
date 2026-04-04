import { test, expect } from '@fixtures/fixtures';
import { makeUniqueEmail } from '@utils/testHelpers';


test.describe("POST /contacts - Add Contact API", () => {
    // Store created contact IDs for cleanup
    const createdContacts: string[] = [];

    // Teardown: Delete all created contacts after each test (pre-authenticated)
    test.afterEach(async ({ contactsApiClient }) => {
        for (const contactId of createdContacts) {
            try {
                await contactsApiClient.deleteContact(contactId);
            } catch (error) {
                console.error(`Failed to delete contact ${contactId}:`, error);
            }
        }
        createdContacts.length = 0; // Clear the array after cleanup
    });

    test('successfully adds a new contact with valid data', async ({ contactsApiClient }) => {
        const client = contactsApiClient;
        const uniqueEmail = makeUniqueEmail();
        const newContact = {
            firstName: 'John',
            lastName: 'Doe',
            email: uniqueEmail,
            address: '123 Main St, Anytown, USA',
        };

        const res = await client.addContact(newContact);

        // Store contact ID for cleanup
        createdContacts.push(res._id);

        // Verify response structure
        expect(res).toHaveProperty('_ids');
        expect(res).toHaveProperty('firstName', newContact.firstName);
        expect(res).toHaveProperty('lastName', newContact.lastName);
        expect(res).toHaveProperty('email', newContact.email);
        // phone and address are optional and may not be returned by the API
        expect(res).toHaveProperty('__v');
    });
});