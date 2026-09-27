import { env } from "@/lib/env";
import { ApiError, networkApiError, parseApiError } from "@/lib/api/errors";

/**
 * Single reusable client for every call to the Laravel API. Every feature
 * module (auth, students, staff, ...) should go through this instead of
 * calling `fetch` directly.
 *
 * Auth mechanism: requests are sent with `credentials: "include"` so that,
 * if the Laravel API uses cookie-based (Sanctum SPA) authentication, the
 * session cookie is attached automatically. This has NOT been confirmed
 * against the real backend — if the API instead uses bearer tokens, add the
 * `Authorization` header here (in one place) once that's verified. See the
 * implementation report for details.
 */

type Json = Record<string, unknown> | unknown[];

interface RequestOptions {
  signal?: AbortSignal;
}

async function request<T>(
  path: string,
  init: RequestInit & RequestOptions = {}
): Promise<T> {
  const url = `${env.apiUrl}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
  } catch (cause) {
    throw networkApiError(cause);
  }

  if (!response.ok) {
    throw await parseApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  try {
    return (await response.json()) as T;
  } catch (cause) {
    throw new ApiError("unknown", "Received an unexpected response from the server.", {
      cause,
    });
  }
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { method: "GET", ...options }),

  post: <T>(path: string, body?: Json, options?: RequestOptions) =>
    request<T>(path, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...options,
    }),

  put: <T>(path: string, body?: Json, options?: RequestOptions) =>
    request<T>(path, {
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...options,
    }),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { method: "DELETE", ...options }),
};
