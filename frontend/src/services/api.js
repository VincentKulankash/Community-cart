const API_BASE_URL = "http://localhost:5000/api";

export async function apiRequest(endpoint, options = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      credentials: "include",
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      "Cannot connect to LocalLoop. Please check that the backend server is running."
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error || `Request failed with status ${response.status}.`
    );
  }

  return data;
}
