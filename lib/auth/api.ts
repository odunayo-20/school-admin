import { apiClient } from "@/lib/api/client";
import { AUTH_ENDPOINTS } from "@/lib/auth/endpoints";
import type { AuthResponse, LoginCredentials, User } from "@/lib/auth/types";

function requireEndpoint(path: string | null, name: string): string {
  if (!path) {
    throw new Error(
      `Laravel "${name}" endpoint is not configured yet. Set it in lib/auth/endpoints.ts once the backend contract is confirmed.`
    );
  }
  return path;
}

export function login(credentials: LoginCredentials): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>(
    requireEndpoint(AUTH_ENDPOINTS.login, "login"),
    { ...credentials }
  );
}

export function logout(): Promise<void> {
  return apiClient.post<void>(requireEndpoint(AUTH_ENDPOINTS.logout, "logout"));
}

export function getCurrentUser(): Promise<User> {
  return apiClient.get<User>(
    requireEndpoint(AUTH_ENDPOINTS.currentUser, "currentUser")
  );
}
