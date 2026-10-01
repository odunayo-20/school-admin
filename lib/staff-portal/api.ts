import { env } from "@/lib/env";
import { networkApiError, parseApiError } from "@/lib/api/errors";
import { getStaffToken } from "@/lib/staff-portal/token";
import { STAFF_PORTAL_ENDPOINTS as E } from "@/lib/staff-portal/endpoints";
import type {
  Assessment,
  AcademicSessionRef,
  CurrentUser,
  LoginCredentials,
  LoginResult,
  Paginated,
  Result,
  BulkCompileOutcome,
  Score,
  TeacherAssignment,
  TermRef,
} from "@/lib/staff-portal/types";

/**
 * Deliberately not the shared `apiClient` (lib/api/client.ts) — same
 * reasoning as lib/student-portal/api.ts: this talks to the real backend
 * (Bearer token, `{data,message}` envelope) while every admin module still
 * targets the mock (cookies, raw resources).
 */
async function request<T>(path: string, init: RequestInit = {}, auth = true): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(init.body ? { "Content-Type": "application/json" } : {}),
    ...(init.headers as Record<string, string> | undefined),
  };

  if (auth) {
    const token = getStaffToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${env.staffPortalApiUrl}${path}`, { ...init, headers });
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

export async function requestPasswordReset(email: string): Promise<void> {
  await request<{ message: string }>(
    E.forgotPassword,
    { method: "POST", body: JSON.stringify({ email }) },
    false
  );
}

export async function getMyAssignments(
  params: { status?: string; page?: number; per_page?: number } = {}
): Promise<Paginated<TeacherAssignment>> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  query.set("page", String(params.page ?? 1));
  query.set("per_page", String(params.per_page ?? 15));
  return request<Paginated<TeacherAssignment>>(`${E.myAssignments}?${query.toString()}`);
}

export async function getAcademicSessions(): Promise<AcademicSessionRef[]> {
  const body = await request<Paginated<AcademicSessionRef>>(`${E.academicSessions}?per_page=100`);
  return body.data;
}

export async function getTerms(academicSessionId: number): Promise<TermRef[]> {
  const body = await request<{ data: TermRef[] }>(E.terms(academicSessionId));
  return body.data;
}

export async function getAssessments(params: { class_subject_id: number; term_id: number }): Promise<Assessment[]> {
  const query = new URLSearchParams({
    class_subject_id: String(params.class_subject_id),
    term_id: String(params.term_id),
    per_page: "100",
  });
  const body = await request<Paginated<Assessment>>(`${E.assessments}?${query.toString()}`);
  return body.data;
}

export async function getScores(params: { assessment_id?: number; enrollment_id?: number }): Promise<Score[]> {
  const query = new URLSearchParams();
  if (params.assessment_id) query.set("assessment_id", String(params.assessment_id));
  if (params.enrollment_id) query.set("enrollment_id", String(params.enrollment_id));
  query.set("per_page", "100");
  const body = await request<Paginated<Score>>(`${E.scores}?${query.toString()}`);
  return body.data;
}

export async function createScore(payload: { assessment_id: number; enrollment_id: number; score: number; remarks?: string | null }): Promise<Score> {
  const body = await request<{ data: Score }>(E.scores, { method: "POST", body: JSON.stringify(payload) });
  return body.data;
}

export async function updateScore(id: number, payload: { score: number; remarks?: string | null }): Promise<Score> {
  const body = await request<{ data: Score }>(E.score(id), { method: "PUT", body: JSON.stringify(payload) });
  return body.data;
}

export async function getResults(params: { class_subject_id: number; term_id: number }): Promise<Result[]> {
  const query = new URLSearchParams({
    class_subject_id: String(params.class_subject_id),
    term_id: String(params.term_id),
    per_page: "100",
  });
  const body = await request<Paginated<Result>>(`${E.results}?${query.toString()}`);
  return body.data;
}

/** Compiles (or recompiles) every currently active enrollment in a class
 * subject's class, for one term — the only backend-sanctioned way to
 * discover a class's roster at all (see the Module 10 report). */
export async function compileClassResults(params: { class_subject_id: number; term_id: number }): Promise<BulkCompileOutcome[]> {
  const body = await request<{ data: BulkCompileOutcome[] }>(E.resultsBulkCompile, {
    method: "POST",
    body: JSON.stringify(params),
  });
  return body.data;
}

export async function submitResult(id: number): Promise<Result> {
  const body = await request<{ data: Result }>(E.resultSubmit(id), { method: "POST" });
  return body.data;
}
