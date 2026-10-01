/**
 * Token storage for admin portal sessions.
 * Caches in memory with browser storage fallback so page reloads stay authenticated.
 */
let inMemoryToken: string | null = null;

const STORAGE_KEY = "admin_auth_token";

export function getAdminToken(): string | null {
  if (inMemoryToken) return inMemoryToken;
  if (typeof window !== "undefined") {
    try {
      inMemoryToken =
        sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
    } catch {
      // Storage access blocked or unavailable
    }
  }
  return inMemoryToken;
}

export function setAdminToken(next: string | null): void {
  inMemoryToken = next;
  if (typeof window !== "undefined") {
    try {
      if (next) {
        localStorage.setItem(STORAGE_KEY, next);
        sessionStorage.setItem(STORAGE_KEY, next);
      } else {
        localStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Storage access blocked or unavailable
    }
  }
}
