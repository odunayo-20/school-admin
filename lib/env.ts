/**
 * Central place to read environment configuration.
 * Never hardcode the API base URL anywhere else in the app.
 */
export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "",
};

if (!env.apiUrl && typeof window === "undefined") {
  // Server-side warning only; avoid throwing so builds without a configured
  // backend (e.g. this scaffold, before the Laravel API URL is known) don't fail.
  console.warn(
    "[env] NEXT_PUBLIC_API_URL is not set. Configure it in .env.local before making API requests."
  );
}
