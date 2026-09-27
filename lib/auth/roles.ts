import type { UserRole } from "@/lib/auth/types";

/**
 * Where to send each role after login. Every role points at the same
 * placeholder dashboard for now — this module only establishes the routing
 * foundation. Later modules can give each role its own area without
 * changing any of the call sites that use this function.
 */
export function getRedirectPathForRole(role: UserRole): string {
  switch (role) {
    case "super_admin":
    case "admin":
    case "registrar":
    case "staff":
    case "student":
      return "/dashboard";
  }
}
