/**
 * CONFIRMED against the real backend (see lib/result-checker/types.ts) —
 * not a proposal. `resultCheckerApiUrl` (lib/env.ts) already points at the
 * `/api/v1`-prefixed host, so this is the route segment only.
 */
export const RESULT_CHECKER_ENDPOINTS = {
  verify: "/api/v1/result-checker",
};
