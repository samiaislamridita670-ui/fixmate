/**
 * Shared API helper for the FixMate frontend.
 *
 * Every request to the Express API carries a short-lived JWT obtained from
 * the Next.js `/api/token` endpoint. The token is issued only after the
 * BetterAuth session cookie has been verified server-side, so the Express
 * layer never trusts identity information sent by the browser.
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type TokenCache = { token: string; expiresAt: number };

let tokenCache: TokenCache | null = null;
let tokenRequest: Promise<string | null> | null = null;

export function clearAuthToken(): void {
  tokenCache = null;
}

/** Fetch (and cache) a JWT for the currently signed-in BetterAuth session. */
export async function getAuthToken(): Promise<string | null> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 5_000) {
    return tokenCache.token;
  }

  if (!tokenRequest) {
    tokenRequest = fetch("/api/token", { credentials: "same-origin" })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = (await res.json().catch(() => null)) as {
          token?: string;
          expiresAt?: number;
        } | null;
        if (!data?.token) return null;
        tokenCache = {
          token: data.token,
          expiresAt: data.expiresAt ?? Date.now() + 10 * 60 * 60 * 1000,
        };
        return tokenCache.token;
      })
      .catch(() => null)
      .finally(() => {
        tokenRequest = null;
      });
  }

  return tokenRequest;
}

type ApiOptions = Omit<RequestInit, "body"> & { body?: unknown };

/**
 * Perform an authenticated JSON request against the Express API.
 * Throws `ApiError` for non-2xx responses with the server message.
 */
export async function apiFetch<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;

  const requestHeaders = new Headers(headers);
  const token = await getAuthToken();
  if (token) requestHeaders.set("Authorization", `Bearer ${token}`);

  let payload: BodyInit | undefined;
  if (body !== undefined && body !== null) {
    if (typeof body === "string") {
      payload = body;
      if (!requestHeaders.has("Content-Type")) requestHeaders.set("Content-Type", "application/json");
    } else {
      payload = JSON.stringify(body);
      requestHeaders.set("Content-Type", "application/json");
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: requestHeaders,
    credentials: "include",
    body: payload,
  });

  const text = await response.text();
  let data: Record<string, unknown> | null = null;
  if (text) {
    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    if (response.status === 401) clearAuthToken();
    const message =
      (typeof data?.message === "string" && data.message) ||
      (response.status === 401
        ? "Your session has expired. Please sign in again."
        : `Request failed with status ${response.status}.`);
    throw new ApiError(message, response.status);
  }

  return data as T;
}

export const api = {
  get: <T = unknown>(path: string, options?: ApiOptions) =>
    apiFetch<T>(path, { ...options, method: "GET" }),
  post: <T = unknown>(path: string, body?: unknown, options?: ApiOptions) =>
    apiFetch<T>(path, { ...options, method: "POST", body }),
  patch: <T = unknown>(path: string, body?: unknown, options?: ApiOptions) =>
    apiFetch<T>(path, { ...options, method: "PATCH", body }),
  put: <T = unknown>(path: string, body?: unknown, options?: ApiOptions) =>
    apiFetch<T>(path, { ...options, method: "PUT", body }),
  delete: <T = unknown>(path: string, options?: ApiOptions) =>
    apiFetch<T>(path, { ...options, method: "DELETE" }),
};
