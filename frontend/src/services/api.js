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
 * - Consistent API error handling (ApiError with status and field errors).
 * - Expired-session event so the app can send people back to login.
 * - Support for JSON and FormData requests.
 */

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000"
).replace(/\/+$/, "");

export const AUTH_EXPIRED_EVENT = "auth:expired";

export class ApiError extends Error {
  constructor(message, { status = 0, code = null, fieldErrors = {}, data = null } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
    this.data = data;
  }
}

const STATUS_MESSAGES = {
  400: "Some of the information you entered isn't valid. Please check it and try again.",
  401: "Please sign in to continue.",
  403: "You don't have permission to do that.",
  404: "We couldn't find what you were looking for.",
  409: "That conflicts with something that already exists.",
  413: "That file is too large.",
  422: "Some of the information you entered isn't valid. Please check it and try again.",
  429: "Too many requests. Please wait a moment and try again.",
};

function messageFromData(data) {
  if (!data) return null;
  if (typeof data === "string") {
    const text = data.trim();
    return text && text.length < 200 && !text.startsWith("<") ? text : null;
  }
  if (typeof data === "object") {
    if (typeof data.error === "string") return data.error;
    if (typeof data.message === "string") return data.message;
  }
  return null;
}

function fieldErrorsFromData(data) {
  if (!data || typeof data !== "object") return {};

  const source = [data.errors, data.details, data.error, data.message].find(
    (value) => value && typeof value === "object" && !Array.isArray(value)
  );
  if (!source) return {};

  const result = {};
  Object.entries(source).forEach(([field, value]) => {
    const text = Array.isArray(value)
      ? value.filter((item) => typeof item === "string").join(" ")
      : typeof value === "string"
        ? value
        : "";
    if (text) result[field] = text;
  });
  return result;
}

export async function apiRequest(endpoint, options = {}) {
  const {
    method = "GET",
    body,
    headers = {},
    notifyAuthExpired = true,
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
    throw new ApiError(
      "Unable to connect to the server. Check your connection and try again.",
      { status: 0, code: "network" }
    );
  }

  if (response.status === 204) {
    if (!response.ok) {
      throw new ApiError("The request could not be completed.", {
        status: response.status,
      });
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
    const status = response.status;
    const message =
      messageFromData(data) ||
      STATUS_MESSAGES[status] ||
      (status >= 500
        ? "The server ran into a problem. Please try again shortly."
        : `Request failed with status ${status}`);

    // A 401 on a normal request means the session is missing or expired.
    // Auth endpoints (login, signup, me, logout) are excluded on purpose.
    if (
      status === 401 &&
      notifyAuthExpired &&
      !endpoint.startsWith("/api/auth/")
    ) {
      window.setTimeout(
        () => window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT)),
        0
      );
    }

    throw new ApiError(message, {
      status,
      code: data && typeof data === "object" ? data.code ?? null : null,
      fieldErrors: fieldErrorsFromData(data),
      data: data && typeof data === "object" ? data : null,
    });
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
