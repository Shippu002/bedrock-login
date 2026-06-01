const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:8000/api/v1" : "");
const AUTH_TOKEN_STORAGE_KEY = "bedrockAuthToken";
const AUTH_DEBUG_ENABLED =
  import.meta.env.VITE_DEBUG_AUTH === "true";

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

function shouldDebugAuthRequest(path, enabled = false) {
  return AUTH_DEBUG_ENABLED && (enabled || String(path).startsWith("/auth/"));
}

function redactDebugValue(key, value) {
  const normalizedKey = String(key).toLowerCase();

  if (
    normalizedKey.includes("password") ||
    normalizedKey.includes("token") ||
    normalizedKey.includes("authorization")
  ) {
    return "[redacted]";
  }

  return value;
}

function redactDebugPayload(payload) {
  if (!payload || typeof payload !== "object") return payload;

  if (typeof FormData !== "undefined" && payload instanceof FormData) {
    return "[FormData]";
  }

  if (Array.isArray(payload)) {
    return payload.map((item) => redactDebugPayload(item));
  }

  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [
      key,
      typeof value === "object" && value !== null
        ? redactDebugPayload(value)
        : redactDebugValue(key, value),
    ]),
  );
}

function redactDebugHeaders(headers) {
  return Object.fromEntries(
    [...headers.entries()].map(([key, value]) => [
      key,
      redactDebugValue(key, value),
    ]),
  );
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
    debugAuth = false,
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
  const shouldDebugAuth = shouldDebugAuthRequest(path, debugAuth);
  let response;

  if (shouldDebugAuth) {
    console.debug("[Bedrock auth API]", {
      phase: "request",
      method,
      url: requestUrl,
      headers: redactDebugHeaders(requestHeaders),
      payload: redactDebugPayload(body),
    });
  }

  try {
    response = await fetch(requestUrl, {
      ...fetchOptions,
      method,
      headers: requestHeaders,
      body: isFormData || typeof body === "string" ? body : JSON.stringify(body),
    });
  } catch (error) {
    if (shouldDebugAuth) {
      console.debug("[Bedrock auth API]", {
        phase: "network-error",
        method,
        url: requestUrl,
        message: error?.message || "Network request failed",
      });
    }

    throw new ApiError(
      `Backend is not reachable at ${API_BASE_URL}. Start the backend server, check VITE_API_BASE_URL, and confirm CORS allows this frontend.`,
      {
        status: 0,
        data: { cause: error?.message || "Network request failed", requestUrl },
      },
    );
  }
  const data = await parseResponse(response);

  if (shouldDebugAuth) {
    console.debug("[Bedrock auth API]", {
      phase: "response",
      method,
      url: requestUrl,
      status: response.status,
      ok: response.ok,
      message: data?.message || data?.error || response.statusText,
    });
  }

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
