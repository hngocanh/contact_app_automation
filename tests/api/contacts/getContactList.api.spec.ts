import { test, expect } from '@fixtures/fixtures';
import { ContactsApiClient } from '@api/ContactsApiClient';
import { makeUniqueEmail } from '@utils/testHelpers';

test.describe('GET /contacts — Get Contact List API', () => {
    const createdContacts: string[] = [];

    test.afterEach(async ({ contactsApiClient }) => {
        for (const contactId of createdContacts) {
            try {
                await contactsApiClient.deleteContact(contactId);
            } catch (error) {
                console.error(`Failed to delete contact ${contactId}:`, error);
            }
        }
        createdContacts.length = 0;
    });

    test('returns an array for any user', async ({ contactsApiClient }) => {
        const client = contactsApiClient;
        const contacts = await client.getContacts();

        expect(Array.isArray(contacts)).toBe(true);
    });

    test('returns array of contacts for authenticated user', async ({ contactsApiClient }) => {
        const client = contactsApiClient;
        const uniqueEmail = makeUniqueEmail('list');
        const newContact = {
            firstName: 'John',
            lastName: 'Doe',
            email: uniqueEmail,
        };

        const added = await client.addContact(newContact);
        createdContacts.push(added._id);

        const contacts = await client.getContacts();

        expect(Array.isArray(contacts)).toBe(true);
        expect(contacts.length).toBeGreaterThan(0);

        const found = contacts.find((c) => c._id === added._id);
        expect(found).toBeDefined();
        expect(found?.firstName).toBe(newContact.firstName);
        expect(found?.lastName).toBe(newContact.lastName);
    });

    test('returns contacts with correct data structure', async ({ contactsApiClient }) => {
        const client = contactsApiClient;
        const uniqueEmail = makeUniqueEmail('struct');
        const newContact = {
            firstName: 'Jane',
            lastName: 'Smith',
            email: uniqueEmail,
        };

        const added = await client.addContact(newContact);
        createdContacts.push(added._id);

        const contacts = await client.getContacts();
        const found = contacts.find((c) => c._id === added._id);

        expect(found).toBeDefined();
        expect(found).toHaveProperty('_id');
        expect(found).toHaveProperty('firstName');
        expect(found).toHaveProperty('lastName');
        expect(found).toHaveProperty('owner');
        expect(found).toHaveProperty('__v');

        expect(typeof found?._id).toBe('string');
        expect(typeof found?.firstName).toBe('string');
        expect(typeof found?.lastName).toBe('string');
        expect(typeof found?.owner).toBe('string');
        expect(typeof found?.__v).toBe('number');
    });

    test('returns multiple contacts for user', async ({ contactsApiClient }) => {
        const client = contactsApiClient;

        const contact1 = await client.addContact({
            firstName: 'Contact',
            lastName: 'One',
            email: makeUniqueEmail('one'),
        });
        createdContacts.push(contact1._id);

        const contact2 = await client.addContact({
            firstName: 'Contact',
            lastName: 'Two',
            email: makeUniqueEmail('two'),
        });
        createdContacts.push(contact2._id);

        const contacts = await client.getContacts();

        expect(contacts.length).toBeGreaterThanOrEqual(2);

        const ids = contacts.map((c) => c._id);
        expect(ids).toContain(contact1._id);
        expect(ids).toContain(contact2._id);
    });

    test('returns only contacts owned by authenticated user', async ({ contactsApiClient, authState }) => {
        const client = contactsApiClient;
        const uniqueEmail = makeUniqueEmail('owner');
        const newContact = {
            firstName: 'Owned',
            lastName: 'Contact',
            email: uniqueEmail,
        };

        const added = await client.addContact(newContact);
        createdContacts.push(added._id);

        const contacts = await client.getContacts();

        for (const contact of contacts) {
            expect(contact.owner).toBe(authState.user._id);
        }
    });

    test('returns contacts with optional fields when provided', async ({ contactsApiClient }) => {
        const client = contactsApiClient;
        const uniqueEmail = makeUniqueEmail('full');
        const fullContact = {
            firstName: 'Full',
            lastName: 'Contact',
            birthdate: '1990-01-15',
            email: uniqueEmail,
            phone: '1234567890',
            street1: '123 Main St',
            street2: 'Apt 1',
            city: 'Test City',
            stateProvince: 'TC',
            postalCode: '12345',
            country: 'Test Country',
        };

        const added = await client.addContact(fullContact);
        createdContacts.push(added._id);

        const contacts = await client.getContacts();
        const found = contacts.find((c) => c._id === added._id);

        expect(found).toBeDefined();
        expect(found?.email).toBe(fullContact.email);
        expect(found?.phone).toBe(fullContact.phone);
        expect(found?.birthdate).toBe(fullContact.birthdate);
        expect(found?.city).toBe(fullContact.city);
    });

    test('returns 401 when no token is provided', async ({ request }) => {
        const client = new ContactsApiClient(request);
        const res = await client.rawGetContacts();
        expect(res.status()).toBe(401);
    });

    test('returns 401 when invalid token is provided', async ({ request }) => {
        const client = new ContactsApiClient(request);
        client.setAuthToken('invalid.token.value');
        const res = await client.rawGetContacts();
        expect(res.status()).toBe(401);
    });

    test('returns 401 when expired token is provided', async ({ request }) => {
        const client = new ContactsApiClient(request);
        const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.expired.token';
        client.setAuthToken(expiredToken);
        const res = await client.rawGetContacts();
        expect(res.status()).toBe(401);
    });

    test('returns 401 when token is empty string', async ({ request }) => {
        const client = new ContactsApiClient(request);
        client.setAuthToken('');
        const res = await client.rawGetContacts();
        expect(res.status()).toBe(401);
    });
});