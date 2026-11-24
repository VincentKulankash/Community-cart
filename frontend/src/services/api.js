
/*
 * DEVELOPER: Vincent
 * RESPONSIBILITY: Shared API request configuration.
 *
 * All frontend services must use this module to communicate
 * with the Flask backend.
 *
 * FEATURES:
 * - Configurable backend URL through Vite environment variables.
 * - JSON request and response handling.
 * - Session cookie support.
 * - Consistent API error handling.
 * - Support for JSON and FormData requests.
 */

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000"
).replace(/\/+$/, "");

export async function apiRequest(endpoint, options = {}) {
  const {
    method = "GET",
    body,
    headers = {},
    ...fetchOptions
  } = options;

  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  const requestHeaders = {
    Accept: "application/json",
    ...(body !== undefined && !isFormData
      ? { "Content-Type": "application/json" }
      : {}),
    ...headers,
  };

  let requestBody = body;

  if (
    body !== undefined &&
    !isFormData &&
    typeof body !== "string"
  ) {
    requestBody = JSON.stringify(body);
  }

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...fetchOptions,
      method,
      credentials: "include",
      headers: requestHeaders,
      ...(requestBody !== undefined ? { body: requestBody } : {}),
    });
  } catch {
    throw new Error(
      "Unable to connect to the server. Check that the backend is running."
    );
  }

  if (response.status === 204) {
    if (!response.ok) {
      throw new Error("The request could not be completed.");
    }
    return null;
  }

  const contentType = response.headers.get("content-type") || "";
  let data = null;

  if (contentType.includes("application/json")) {
    data = await response.json().catch(() => null);
  } else {
    data = await response.text().catch(() => "");
  }

  if (!response.ok) {
    const message =
      (typeof data === "object" && data !== null
        ? data.error || data.message
        : data) ||
      `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return data;
}

// Convenience methods for feature services.

export function get(endpoint, options = {}) {
  return apiRequest(endpoint, { ...options, method: "GET" });
}

export function post(endpoint, body, options = {}) {
  return apiRequest(endpoint, { ...options, method: "POST", body });
}

export function patch(endpoint, body, options = {}) {
  return apiRequest(endpoint, { ...options, method: "PATCH", body });
}

export function put(endpoint, body, options = {}) {
  return apiRequest(endpoint, { ...options, method: "PUT", body });
}

export function remove(endpoint, options = {}) {
  return apiRequest(endpoint, { ...options, method: "DELETE" });
}

// Optional grouped interface.

const api = {
  request: apiRequest,
  get,
  post,
  patch,
  put,
  delete: remove,
};

export default api;
