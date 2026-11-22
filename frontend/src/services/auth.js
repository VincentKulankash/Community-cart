import { get, post } from "./api";

const AUTH_ENDPOINT = "/api/auth";

export function registerUser(userData) {
  return post(`${AUTH_ENDPOINT}/signup`, userData);
}

export function loginUser(credentials) {
  return post(`${AUTH_ENDPOINT}/login`, credentials);
}

export function getCurrentUser() {
  return get(`${AUTH_ENDPOINT}/me`);
}

export function logoutUser() {
  return post(`${AUTH_ENDPOINT}/logout`);
}
