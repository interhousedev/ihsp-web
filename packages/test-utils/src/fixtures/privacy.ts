import type { AdminErasureRequest, DataExport, ErasureRequest } from "@ihsp/api"

export const PRIVACY_EXPORT_ID = "0f1e2d3c-0000-4000-8000-0000000000e1"
export const PRIVACY_ERASURE_ID = "0f1e2d3c-0000-4000-8000-0000000000d1"

export function dataExport(overrides: Partial<DataExport> = {}): DataExport {
  return {
    id: PRIVACY_EXPORT_ID,
    status: "ready",
    created_at: "2026-11-10T09:00:00Z",
    finished_at: "2026-11-10T09:02:00Z",
    expires_at: "2099-11-17T09:02:00Z",
    byte_size: 2_400_000,
    ...overrides,
  }
}

export function erasureRequest(overrides: Partial<ErasureRequest> = {}): ErasureRequest {
  return {
    id: PRIVACY_ERASURE_ID,
    status: "pending_review",
    requested_at: "2026-11-12T08:00:00Z",
    decided_at: null,
    reject_reason: null,
    closes_on: null,
    ...overrides,
  }
}

export function adminErasureRequest(overrides: Partial<AdminErasureRequest> = {}): AdminErasureRequest {
  return {
    ...erasureRequest(),
    user_id: "0f1e2d3c-0000-4000-8000-0000000000u1",
    login: "a.karimov",
    name: "Aziz Karimov",
    roles: ["student"],
    ...overrides,
  }
}

export const adminErasureRequests: AdminErasureRequest[] = [
  adminErasureRequest(),
  adminErasureRequest({
    id: "0f1e2d3c-0000-4000-8000-0000000000d2",
    login: "m.saidova",
    name: "Malika Saidova",
    roles: ["teacher"],
  }),
]
