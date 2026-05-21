const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:8000/api/v1" : "");
const AUTH_TOKEN_STORAGE_KEY = "bedrockAuthToken";

export class ApiError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "ApiError";
    this.status = options.status || 0;
    this.data = options.data || null;
  }
}

export function getAuthToken() {
  try {
    return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

export function setAuthToken(token) {
  try {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    }
  } catch {
    // Storage can fail in private browsing; the request will still run.
  }
}

export function clearAuthToken() {
  setAuthToken("");
}

function buildApiUrl(path) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (!API_BASE_URL) {
    throw new ApiError(
      "API base URL is not configured. Add VITE_API_BASE_URL to your .env file.",
      { status: 0 },
    );
  }

  const baseUrl = API_BASE_URL.replace(/\/+$/, "");
  const apiPath = String(path || "").replace(/^\/+/, "");

  return `${baseUrl}/${apiPath}`;
}

export function withQuery(path, params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.set(key, String(value));
  });

  const queryString = searchParams.toString();

  return queryString ? `${path}?${queryString}` : path;
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (response.status === 204) {
    return null;
  }

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

export async function apiRequest(path, options = {}) {
  const {
    body,
    headers,
    method = body ? "POST" : "GET",
    skipAuth = false,
    ...fetchOptions
  } = options;
  const token = getAuthToken();
  const requestHeaders = new Headers(headers || {});

  if (!requestHeaders.has("Accept")) {
    requestHeaders.set("Accept", "application/json");
  }

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  if (body !== undefined && !isFormData && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (!skipAuth && token && !requestHeaders.has("Authorization")) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const requestUrl = buildApiUrl(path);
  let response;

  try {
    response = await fetch(requestUrl, {
      ...fetchOptions,
      method,
      headers: requestHeaders,
      body: isFormData || typeof body === "string" ? body : JSON.stringify(body),
    });
  } catch (error) {
    throw new ApiError(
      `Backend is not reachable at ${API_BASE_URL}. Start the backend server, check VITE_API_BASE_URL, and confirm CORS allows this frontend.`,
      {
        status: 0,
        data: { cause: error?.message || "Network request failed", requestUrl },
      },
    );
  }
  const data = await parseResponse(response);

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      `Request failed with status ${response.status}`;

    throw new ApiError(message, {
      status: response.status,
      data,
    });
  }

  return data;
}

export const apiClient = {
  get: (path, options) => apiRequest(path, { ...options, method: "GET" }),
  post: (path, body, options) =>
    apiRequest(path, { ...options, method: "POST", body }),
  put: (path, body, options) =>
    apiRequest(path, { ...options, method: "PUT", body }),
  patch: (path, body, options) =>
    apiRequest(path, { ...options, method: "PATCH", body }),
  delete: (path, options) => apiRequest(path, { ...options, method: "DELETE" }),
};
