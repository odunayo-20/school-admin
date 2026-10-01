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
  | "student"
  | "SUPER_ADMIN"
  | "ADMIN"
  | "REGISTRAR"
  | "STAFF"
  | "STUDENT";

export interface Permission {
  name: string;
}

export interface User {
  id: number | string;
  name: string;
  email: string;
  role: UserRole;
  status?: string;
  staff_type?: string | null;
  email_verified?: boolean;
  last_login_at?: string | null;
  permissions?: (Permission | string)[];
}

export interface AuthResponse {
  user: User;
  token?: string;
  token_type?: string;
  expires_at?: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

