import { env } from "@/lib/env";
import { ApiError, networkApiError, parseApiError } from "@/lib/api/errors";
import { getAdminToken } from "@/lib/auth/token";

/**
 * Single reusable client for every call to the Laravel API. Every feature
 * module (auth, students, staff, ...) goes through this.
 *
 * Auth mechanism: uses stateless Sanctum Bearer tokens (Authorization: Bearer <token>)
 * matching school-system-api's authentication scheme.
 */

type Json = Record<string, unknown> | unknown[];

interface RequestOptions {
  signal?: AbortSignal;
}

function normalizePath(path: string): string {
  if (path.startsWith("/api/") && !path.startsWith("/api/v1/")) {
    return path.replace("/api/", "/api/v1/");
  }
  return path;
}

async function request<T>(
  path: string,
  init: RequestInit & RequestOptions = {}
): Promise<T> {
  const url = `${env.apiUrl}${normalizePath(path)}`;
  const token = getAdminToken();

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(init.body ? { "Content-Type": "application/json" } : {}),
    ...(init.headers as Record<string, string> | undefined),
  };

  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers,
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
    const json = await response.json();
    // Unwrap Laravel's { data: resource } envelope for single resources,
    // preserving { data: [...], meta: {...} } for paginated collections.
    if (
      json !== null &&
      typeof json === "object" &&
      "data" in json &&
      !("meta" in json)
    ) {
      return (json as { data: T }).data;
    }
    return json as T;
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
