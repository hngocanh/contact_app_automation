/**
 * api.types.ts
 * Single source of truth for all request and response shapes
 * used across API clients, tests, and data factories.
 *
 * Based on: https://thinking-tester-contact-list.herokuapp.com
 */

// ─── User ────────────────────────────────────────────────────────────────────

export interface AddUserPayload {
  firstName: string;
  lastName:  string;
  email:     string;
  password:  string;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?:  string;
  email?:     string;
  password?:  string;
}

export interface User {
  _id:       string;
  firstName: string;
  lastName:  string;
  email:     string;
  __v:       number;
}

export interface LoginPayload {
  email:    string;
  password: string;
}

export interface LoginResponse {
  user:  User;
  token: string;
}

// ─── Contact ─────────────────────────────────────────────────────────────────

export interface AddContactPayload {
  firstName:   string;
  lastName:    string;
  birthdate?:  string;   // "YYYY-MM-DD"
  email?:      string;
  phone?:      string;
  street1?:    string;
  street2?:    string;
  city?:       string;
  stateProvince?: string;
  postalCode?: string;
  country?:    string;
}

/** PUT requires all fields; PATCH allows partial */
export type UpdateContactPayload   = AddContactPayload;
export type PatchContactPayload    = Partial<AddContactPayload>;

export interface Contact {
  _id:            string;
  firstName:      string;
  lastName:       string;
  birthdate?:     string;
  email?:         string;
  phone?:         string;
  street1?:       string;
  street2?:       string;
  city?:          string;
  stateProvince?: string;
  postalCode?:    string;
  country?:       string;
  owner:          string;   // user _id
  __v:            number;
}
