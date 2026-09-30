/**
 * Error handling for the Laravel API client.
 *
 * The shape assumed here (`message` + `errors` map) matches Laravel's default
 * exception handler / validation response format, which is a framework
 * convention rather than an app-specific guess. It has NOT been confirmed
 * against this project's actual Laravel API — verify once the backend is
 * available and adjust `parseApiError` if the real responses differ.
 */

export type ApiErrorKind =
  | "validation"
  | "authentication"
  | "authorization"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "server"
  | "network"
  | "unknown";

export interface LaravelErrorBody {
  message?: string;
  errors?: Record<string, string[]>;
  /** Optional machine-readable discriminator for endpoints that need to
   * distinguish specific, intentionally-disclosed failure states (e.g. an
   * expired vs. used-up vs. generically-invalid credential) without
   * overloading the free-text `message`. Most endpoints won't set this. */
  code?: string;
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;
  readonly fieldErrors?: Record<string, string[]>;
  readonly code?: string;
  /** Seconds to wait before retrying, read from a 429 response's
   * `Retry-After` header — never computed client-side. */
  readonly retryAfterSeconds?: number;
  readonly cause_?: unknown;

  constructor(
    kind: ApiErrorKind,
    message: string,
    options?: {
      status?: number | null;
      fieldErrors?: Record<string, string[]>;
      code?: string;
      retryAfterSeconds?: number;
      cause?: unknown;
    }
  ) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = options?.status ?? null;
    this.fieldErrors = options?.fieldErrors;
    this.code = options?.code;
    this.retryAfterSeconds = options?.retryAfterSeconds;
    this.cause_ = options?.cause;
  }
}

function kindFromStatus(status: number): ApiErrorKind {
  if (status === 422) return "validation";
  if (status === 401) return "authentication";
  if (status === 403) return "authorization";
  if (status === 404) return "not_found";
  if (status === 409) return "conflict";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "server";
  return "unknown";
}

function fallbackMessage(kind: ApiErrorKind): string {
  switch (kind) {
    case "validation":
      return "Some fields need your attention.";
    case "authentication":
      return "Your session has expired. Please sign in again.";
    case "authorization":
      return "You don't have permission to do that.";
    case "not_found":
      return "The requested resource could not be found.";
    case "conflict":
      return "This conflicts with an existing record.";
    case "rate_limited":
      return "Too many attempts. Please wait a moment and try again.";
    case "server":
      return "Something went wrong on our end. Please try again shortly.";
    case "network":
      return "Unable to reach the server. Check your connection and try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

/** Builds an ApiError from a failed fetch Response. Never leaks raw stack traces. */
export async function parseApiError(response: Response): Promise<ApiError> {
  const kind = kindFromStatus(response.status);
  let body: LaravelErrorBody | undefined;

  try {
    body = (await response.json()) as LaravelErrorBody;
  } catch {
    // Response had no JSON body (e.g. a proxy/gateway error page).
  }

  // For server errors, never trust the backend's message field as user-facing
  // text — in debug mode Laravel can put exception details there.
  const message = kind === "server" ? fallbackMessage(kind) : body?.message || fallbackMessage(kind);

  let retryAfterSeconds: number | undefined;
  if (kind === "rate_limited") {
    const header = response.headers.get("Retry-After");
    const parsed = header ? Number(header) : NaN;
    if (Number.isFinite(parsed) && parsed >= 0) retryAfterSeconds = parsed;
  }

  return new ApiError(kind, message, {
    status: response.status,
    fieldErrors: body?.errors,
    code: body?.code,
    retryAfterSeconds,
  });
}

export function networkApiError(cause: unknown): ApiError {
  return new ApiError("network", fallbackMessage("network"), { cause });
}
