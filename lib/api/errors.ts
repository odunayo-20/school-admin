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
  | "server"
  | "network"
  | "unknown";

export interface LaravelErrorBody {
  message?: string;
  errors?: Record<string, string[]>;
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;
  readonly fieldErrors?: Record<string, string[]>;
  readonly cause_?: unknown;

  constructor(
    kind: ApiErrorKind,
    message: string,
    options?: {
      status?: number | null;
      fieldErrors?: Record<string, string[]>;
      cause?: unknown;
    }
  ) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = options?.status ?? null;
    this.fieldErrors = options?.fieldErrors;
    this.cause_ = options?.cause;
  }
}

function kindFromStatus(status: number): ApiErrorKind {
  if (status === 422) return "validation";
  if (status === 401) return "authentication";
  if (status === 403) return "authorization";
  if (status === 404) return "not_found";
  if (status === 409) return "conflict";
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

  return new ApiError(kind, message, {
    status: response.status,
    fieldErrors: body?.errors,
  });
}

export function networkApiError(cause: unknown): ApiError {
  return new ApiError("network", fallbackMessage("network"), { cause });
}
