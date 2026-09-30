import { env } from "@/lib/env";
import { networkApiError, parseApiError } from "@/lib/api/errors";
import { RESULT_CHECKER_ENDPOINTS as E } from "@/lib/result-checker/endpoints";
import type { ResultCheckRequest, VerifiedResult } from "@/lib/result-checker/types";

/**
 * Deliberately NOT the shared `apiClient` (lib/api/client.ts). That client
 * targets the mock every other module still runs against — raw resources,
 * no envelope, `/api` without a version prefix. The real backend wraps a
 * success response as `{ data, message }` and lives (possibly) at a
 * different host — see lib/env.ts's `resultCheckerApiUrl`. Reuses
 * `ApiError`/`parseApiError` unchanged, since the FAILURE envelope
 * (`{ message, errors? }`) is identical between the real API and the mock.
 * Once every module is reconciled against the real backend, this
 * distinction goes away and this file can move onto the shared client.
 */
export async function verifyResult(data: ResultCheckRequest): Promise<VerifiedResult> {
  let response: Response;
  try {
    response = await fetch(`${env.resultCheckerApiUrl}${E.verify}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(data),
    });
  } catch (cause) {
    throw networkApiError(cause);
  }

  if (!response.ok) {
    throw await parseApiError(response);
  }

  const body = (await response.json()) as { data: VerifiedResult };
  return body.data;
}
