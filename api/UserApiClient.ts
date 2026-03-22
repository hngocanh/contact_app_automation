import { APIRequestContext, APIResponse } from '@playwright/test';
import { BaseApiClient } from './BaseApiClient';
import {
  AddUserPayload,
  UpdateUserPayload,
  LoginPayload,
  LoginResponse,
  User,
} from '../types/api.types';

/**
 * UsersApiClient
 *
 * Covers all endpoints under /users:
 *
 *   POST   /users            → create a new user account (no auth)
 *   POST   /users/login      → log in, receive JWT token
 *   GET    /users/me         → get current user profile (auth required)
 *   PATCH  /users/me         → update current user profile (auth required)
 *   DELETE /users/me         → delete current user account (auth required)
 *   POST   /users/logout     → invalidate current token (auth required)
 */
export class UsersApiClient extends BaseApiClient {
  private static readonly BASE = '/users';

  constructor(request: APIRequestContext) {
    super(request);
  }

  // ── Happy-path methods (throw on non-2xx) ─────────────────────────────────

  /**
   * Register a new user.
   * POST /users → 201
   * Returns the created User object AND the token.
   */
  async addUser(payload: AddUserPayload): Promise<LoginResponse> {
    return this.post<LoginResponse>(UsersApiClient.BASE, payload);
  }

  /**
   * Log in with email + password.
   * POST /users/login → 200
   * Returns the User object AND a JWT token.
   */
  async login(payload: LoginPayload): Promise<LoginResponse> {
    return this.post<LoginResponse>(`${UsersApiClient.BASE}/login`, payload);
  }

  /**
   * Retrieve the profile of the currently authenticated user.
   * GET /users/me → 200
   */
  async getProfile(): Promise<User> {
    return this.get<User>(`${UsersApiClient.BASE}/me`);
  }

  /**
   * Partially update the current user's profile.
   * PATCH /users/me → 200
   */
  async updateProfile(payload: UpdateUserPayload): Promise<User> {
    return this.patch<User>(`${UsersApiClient.BASE}/me`, payload);
  }

  /**
   * Delete the current user's account.
   * DELETE /users/me → 200
   */
  async deleteMe(): Promise<void> {
    return this.delete(`${UsersApiClient.BASE}/me`);
  }

  /**
   * Log out — invalidates the current JWT on the server.
   * POST /users/logout → 200
   */
  async logout(): Promise<void> {
    await this.post<unknown>(`${UsersApiClient.BASE}/logout`, {});
    this.clearAuthToken();
  }

  // ── Raw methods (return full APIResponse for negative-test assertions) ─────

  /** Use when you need to assert on status code, e.g. 400 / 401 / 409 */
  rawAddUser(payload: Partial<AddUserPayload>): Promise<APIResponse> {
    return this.rawPost(UsersApiClient.BASE, payload);
  }

  rawLogin(payload: Partial<LoginPayload>): Promise<APIResponse> {
    return this.rawPost(`${UsersApiClient.BASE}/login`, payload);
  }

  rawGetProfile(): Promise<APIResponse> {
    return this.rawGet(`${UsersApiClient.BASE}/me`);
  }

  rawUpdateProfile(payload: Partial<UpdateUserPayload>): Promise<APIResponse> {
    return this.rawPatch(`${UsersApiClient.BASE}/me`, payload);
  }

  rawDeleteMe(): Promise<APIResponse> {
    return this.rawDelete(`${UsersApiClient.BASE}/me`);
  }
}
