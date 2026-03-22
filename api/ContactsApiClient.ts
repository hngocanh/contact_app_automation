import { APIRequestContext, APIResponse } from '@playwright/test';
import { BaseApiClient } from './BaseApiClient';
import {
  AddContactPayload,
  UpdateContactPayload,
  PatchContactPayload,
  Contact,
} from '../types/api.types';

/**
 * ContactsApiClient
 *
 * Covers all endpoints under /contacts:
 *
 *   POST   /contacts         → add a new contact (auth required)
 *   GET    /contacts         → list all contacts for the current user (auth required)
 *   GET    /contacts/:id     → get a single contact by ID (auth required)
 *   PUT    /contacts/:id     → full replace of a contact (auth required)
 *   PATCH  /contacts/:id     → partial update of a contact (auth required)
 *   DELETE /contacts/:id     → delete a contact (auth required)
 */
export class ContactsApiClient extends BaseApiClient {
  private static readonly BASE = '/contacts';

  constructor(request: APIRequestContext) {
    super(request);
  }

  // ── Happy-path methods (throw on non-2xx) ─────────────────────────────────

  /**
   * Create a new contact.
   * POST /contacts → 201
   * Only firstName and lastName are required; all other fields are optional.
   */
  async addContact(payload: AddContactPayload): Promise<Contact> {
    return this.post<Contact>(ContactsApiClient.BASE, payload);
  }

  /**
   * Get all contacts belonging to the current user.
   * GET /contacts → 200
   */
  async getContacts(): Promise<Contact[]> {
    return this.get<Contact[]>(ContactsApiClient.BASE);
  }

  /**
   * Get a single contact by its _id.
   * GET /contacts/:id → 200
   */
  async getContact(id: string): Promise<Contact> {
    return this.get<Contact>(`${ContactsApiClient.BASE}/${id}`);
  }

  /**
   * Fully replace a contact (all fields required).
   * PUT /contacts/:id → 200
   */
  async updateContact(id: string, payload: UpdateContactPayload): Promise<Contact> {
    return this.put<Contact>(`${ContactsApiClient.BASE}/${id}`, payload);
  }

  /**
   * Partially update a contact (only send fields you want to change).
   * PATCH /contacts/:id → 200
   */
  async patchContact(id: string, payload: PatchContactPayload): Promise<Contact> {
    return this.patch<Contact>(`${ContactsApiClient.BASE}/${id}`, payload);
  }

  /**
   * Delete a contact.
   * DELETE /contacts/:id → 200
   */
  async deleteContact(id: string): Promise<void> {
    return this.delete(`${ContactsApiClient.BASE}/${id}`);
  }

  // ── Raw methods (return full APIResponse for negative-test assertions) ─────

  rawAddContact(payload: Partial<AddContactPayload>): Promise<APIResponse> {
    return this.rawPost(ContactsApiClient.BASE, payload);
  }

  rawGetContact(id: string): Promise<APIResponse> {
    return this.rawGet(`${ContactsApiClient.BASE}/${id}`);
  }

  rawUpdateContact(id: string, payload: Partial<UpdateContactPayload>): Promise<APIResponse> {
    return this.rawPut(`${ContactsApiClient.BASE}/${id}`, payload);
  }

  rawPatchContact(id: string, payload: PatchContactPayload): Promise<APIResponse> {
    return this.rawPatch(`${ContactsApiClient.BASE}/${id}`, payload);
  }

  rawDeleteContact(id: string): Promise<APIResponse> {
    return this.rawDelete(`${ContactsApiClient.BASE}/${id}`);
  }
}
