import { env } from "@/lib/env";
import { networkApiError, parseApiError } from "@/lib/api/errors";
import { getStudentToken } from "@/lib/student-portal/token";
import { STUDENT_PORTAL_ENDPOINTS as E } from "@/lib/student-portal/endpoints";
import type {
  CurrentEnrollment,
  CurrentUser,
  LoginCredentials,
  LoginResult,
  Paginated,
  ReportCard,
  ReportCardHistoryItem,
} from "@/lib/student-portal/types";

/**
 * Deliberately not the shared `apiClient` (lib/api/client.ts) — same
 * reasoning as lib/result-checker/api.ts: this talks to the real backend
 * (Bearer token, `{data,message}` envelope) while every other module still
 * targets the mock (cookies, raw resources). Once every module has moved
 * over this distinction goes away.
 */
async function request<T>(path: string, init: RequestInit = {}, auth = true): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(init.body ? { "Content-Type": "application/json" } : {}),
    ...(init.headers as Record<string, string> | undefined),
  };

  if (auth) {
    const token = getStudentToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${env.studentPortalApiUrl}${path}`, { ...init, headers });
  } catch (cause) {
    throw networkApiError(cause);
  }

  if (!response.ok) {
    throw await parseApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function login(credentials: LoginCredentials): Promise<LoginResult> {
  const body = await request<{ data: LoginResult; message: string }>(
    E.login,
    { method: "POST", body: JSON.stringify(credentials) },
    false
  );
  return body.data;
}

export async function logout(): Promise<void> {
  await request<void>(E.logout, { method: "POST" });
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const body = await request<{ data: CurrentUser }>(E.me);
  return body.data;
}

/** Requests an email reset link for the given address — the only
 * password-reset mechanism the backend currently exposes; see the Module
 * 09 report for why there is no in-session "change password" form. */
export async function requestPasswordReset(email: string): Promise<void> {
  await request<{ message: string }>(
    E.forgotPassword,
    { method: "POST", body: JSON.stringify({ email }) },
    false
  );
}

/** Consumes the token from the link that `requestPasswordReset` emails out. */
export async function resetPassword(payload: {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}): Promise<void> {
  await request<{ message: string }>(
    E.resetPassword,
    { method: "POST", body: JSON.stringify(payload) },
    false
  );
}

/** Null when the caller has no ACTIVE enrollment for the current academic
 * session — a normal state (see EnrollmentController::me()), not an error. */
export async function getCurrentEnrollment(): Promise<CurrentEnrollment | null> {
  const body = await request<{ data: CurrentEnrollment | null; message?: string }>(E.currentEnrollment);
  return body.data;
}

export async function getReportCardHistory(studentId: number, page: number): Promise<Paginated<ReportCardHistoryItem>> {
  const params = new URLSearchParams({ page: String(page) });
  return request<Paginated<ReportCardHistoryItem>>(`${E.reportCardHistory(studentId)}?${params.toString()}`);
}

export async function getReportCard(enrollmentId: number, termId: number): Promise<ReportCard> {
  const body = await request<{ data: ReportCard }>(E.reportCard(enrollmentId, termId));
  return body.data;
}
