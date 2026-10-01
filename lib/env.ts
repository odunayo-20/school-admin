/**
 * Central place to read environment configuration.
 * Never hardcode the API base URL anywhere else in the app.
 */
export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "",
  /**
   * The real Laravel backend (odunayo-20/school-system-api), now reachable.
   * Only lib/result-checker talks to it so far — every other module is
   * still reconciling against its own proposed-contract mock, module by
   * module, the same way this project has always worked. Falls back to
   * `apiUrl` so this collapses to one URL once every module has moved over.
   */
  resultCheckerApiUrl:
    process.env.NEXT_PUBLIC_RESULT_CHECKER_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "",
  /** Same real backend as resultCheckerApiUrl — separate override var in
   * case the two are ever split across environments, same fallback chain
   * otherwise. */
  studentPortalApiUrl:
    process.env.NEXT_PUBLIC_STUDENT_PORTAL_API_URL ??
    process.env.NEXT_PUBLIC_RESULT_CHECKER_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "",
};

if (!env.apiUrl && typeof window === "undefined") {
  // Server-side warning only; avoid throwing so builds without a configured
  // backend (e.g. this scaffold, before the Laravel API URL is known) don't fail.
  console.warn(
    "[env] NEXT_PUBLIC_API_URL is not set. Configure it in .env.local before making API requests."
  );
}
