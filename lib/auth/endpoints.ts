/**
 * Laravel authentication endpoint paths.
 *
 * INTENTIONALLY LEFT UNSET. No Laravel API project or API documentation was
 * available in this workspace to confirm the real routes, so per the project
 * instructions these are not guessed (e.g. as `/login` or `/api/login`).
 *
 * Once `routes/api.php` / the auth controller is available, fill these in
 * (and add a CSRF-cookie endpoint here too if the API uses Sanctum's SPA
 * cookie flow). Nothing else in the app needs to change — `lib/auth/api.ts`
 * reads from this file exclusively.
 */
export const AUTH_ENDPOINTS = {
  login: null as string | null,
  logout: null as string | null,
  currentUser: null as string | null,
};
