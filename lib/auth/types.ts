/**
 * These types describe the shape we EXPECT the Laravel API to use, based on
 * common conventions (and the roles listed in the project brief). They have
 * NOT been verified against the real API — there was no Laravel project or
 * API documentation available to inspect. Update these once the actual
 * `/login` and current-user endpoint responses are confirmed.
 */

export type UserRole =
  | "super_admin"
  | "admin"
  | "registrar"
  | "staff"
  | "student";

export interface Permission {
  name: string;
}

export interface User {
  id: number | string;
  name: string;
  email: string;
  role: UserRole;
  permissions?: Permission[];
}

export interface AuthResponse {
  user: User;
  /** Only present if the API turns out to use token-based auth instead of cookies. */
  token?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
