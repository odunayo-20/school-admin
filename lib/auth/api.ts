import { apiClient } from "@/lib/api/client";
import { AUTH_ENDPOINTS } from "@/lib/auth/endpoints";
import { setAdminToken } from "@/lib/auth/token";
import type { AuthResponse, LoginCredentials, User, UserRole } from "@/lib/auth/types";

function requireEndpoint(path: string | null, name: string): string {
  if (!path) {
    throw new Error(
      `Laravel "${name}" endpoint is not configured yet. Set it in lib/auth/endpoints.ts once the backend contract is confirmed.`
    );
  }
  return path;
}

function normalizeUser(raw: Record<string, unknown>): User {
  const role = (
    typeof raw.role === "string" ? raw.role.toLowerCase() : "staff"
  ) as UserRole;

  return {
    ...(raw as unknown as User),
    role,
  };
}

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  interface LaravelLoginData {
    user: Record<string, unknown>;
    token: string;
    token_type: string;
    expires_at: string;
  }

  interface LaravelLoginResponse {
    data: LaravelLoginData;
    message?: string;
  }

  const res = await apiClient.post<LaravelLoginResponse | AuthResponse>(
    requireEndpoint(AUTH_ENDPOINTS.login, "login"),
    { ...credentials }
  );

  const payload = "data" in res && res.data ? res.data : (res as unknown as LaravelLoginData);
  const user = normalizeUser(payload.user as Record<string, unknown>);
  const token = payload.token;

  if (token) {
    setAdminToken(token);
  }

  return { user, token };
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post<void>(requireEndpoint(AUTH_ENDPOINTS.logout, "logout"));
  } finally {
    setAdminToken(null);
  }
}

export async function getCurrentUser(): Promise<User> {
  interface LaravelMeResponse {
    data: Record<string, unknown>;
  }

  const res = await apiClient.get<LaravelMeResponse | Record<string, unknown>>(
    requireEndpoint(AUTH_ENDPOINTS.currentUser, "currentUser")
  );

  const rawUser = (
    "data" in res && res.data ? res.data : res
  ) as Record<string, unknown>;
  return normalizeUser(rawUser);
}


