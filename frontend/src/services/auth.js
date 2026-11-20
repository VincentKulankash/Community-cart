
/*
 * DEVELOPER: Branis (feature owner) / Vincent (API integration)
 * RESPONSIBILITY: Authentication API service.
 *
 * Handles:
 * - User registration
 * - User login
 * - Current-user/session verification
 * - User logout
 *
 * INTEGRATION:
 * - Uses the shared api.js configuration.
 * - Does not implement its own fetch configuration.
 * - Preserves the existing function names used by the UI.
 */

import { get, post } from "./api";

const AUTH_ENDPOINT = "/api/auth";

// Register a new user.
export function registerUser(userData) {
  return post(`${AUTH_ENDPOINT}/signup`, userData);
}

// Log in an existing user.
export function loginUser(credentials) {
  return post(`${AUTH_ENDPOINT}/login`, credentials);
}

// Verify the currently authenticated user.
export function getCurrentUser() {
  return get(`${AUTH_ENDPOINT}/me`);
}

// Log out the current user.
export function logoutUser() {
  return post(`${AUTH_ENDPOINT}/logout`);
}
