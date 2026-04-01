import {test, expect} from '@playwright/test';
import { ContactsApiClient } from '@api/ContactsApiClient';

test.describe("POST /contacts - Add Contact API", () => {
    // Store created contact IDs for cleanup
    const createdContacts: string[] = [];

    // Teardown: Delete all created contacts after each test
    test.afterEach(async ({ request }) => {
        const client = new ContactsApiClient(request);
        for (const contactId of createdContacts) {
            try {
                await client.deleteContact(contactId);
            } catch (error) {
                console.error(`Failed to delete contact ${contactId}:`, error);
            }
        }
        createdContacts.length = 0; // Clear the array after cleanup
    });

    test('successfully adds a new contact with valid data', async ({ request }) => {
        const client = new ContactsApiClient(request);
        const newContact = {
            firstName: 'John',
            lastName: 'Doe',
            email: `john.doe.${Date.now()}@example.com`,
            phone: '123-456-7890',
            address: '123 Main St, Anytown, USA',
        };

        const res = await client.addContact(newContact);

        // Store contact ID for cleanup
        createdContacts.push(res._id);

        // Verify response structure
        expect(res).toHaveProperty('_id');
        expect(res).toHaveProperty('firstName', newContact.firstName);
        expect(res).toHaveProperty('lastName', newContact.lastName);
        expect(res).toHaveProperty('email', newContact.email);
        expect(res).toHaveProperty('phone', newContact.phone);
        expect(res).toHaveProperty('address', newContact.address);
        expect(res).toHaveProperty('__v');
    });
});