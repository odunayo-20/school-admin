/**
 * Module 05 — Admission Endpoints
 * All paths map to Laravel /api/v1/admissions via client normalizePath
 */
export const ADMISSION_ENDPOINTS = {
  admissions: "/api/admissions",
  admission: (id: number) => `/api/admissions/${id}`,
  admit: (id: number) => `/api/admissions/${id}/admit`,
  approve: (id: number) => `/api/admissions/${id}/admit`, // backward compatibility alias
  reject: (id: number) => `/api/admissions/${id}/reject`,
  withdraw: (id: number) => `/api/admissions/${id}/withdraw`,
};
