// Admission consent, legal re-acceptance and privacy endpoints (shapes follow packages/api/openapi.json).

import { api, keys, queryOptions } from "@ihsp/api"

export type AdmissionLegalKind =
  | "privacy"
  | "terms"
  | "biometric"
  | "ai"
  | "admission_privacy"
  | "admission_terms"
  | "admission_disclaimer"
export type LegalScope =
  | "global"
  | "id"
  | "sp"
  | "staff"
  | "admin"
  | "lms"
  | "library"
  | "share"
  | "landing"
  | "admission"

export type PendingItem = {
  kind: AdmissionLegalKind
  app_scope: LegalScope
  version: number
  locale: string
  title: string
  body_markdown: string
  announcement: string | null
  previously_accepted_version: number | null
  published_at: string | null
}
export type Pending = { items: PendingItem[] }

export type PurposeGrant = {
  purpose: string
  method: string
  given_at: string
  withdrawn_at: string | null
  active: boolean
}
export type Consent = { grants: PurposeGrant[]; non_ai_mode: boolean }

export type AuditRecord = {
  at: string
  actor_kind: string
  action: string
  object_type: string | null
  object_id: string | null
  staff_role_id: string | null
}
export type Audit = { items: AuditRecord[] }
export type DataExport = {
  generated_at: string
  tables: Record<string, Record<string, unknown>[]>
  access_log: AuditRecord[]
}
export type Erased = { deleted: Record<string, number> }

export const consentKeys = {
  consent: () => ["admission", "consent"] as const,
  audit: () => ["admission", "privacy", "audit"] as const,
}

/** Pending documents; the client sends `X-IHSP-App`, so the list is this app's. Shares the key of the legal gate. */
export const pendingQuery = () =>
  queryOptions({
    queryKey: keys.legal.pending(),
    queryFn: ({ signal }) => api.get<Pending>("/v1/me/legal/pending", { signal }),
  })

export function getConsent(signal?: AbortSignal): Promise<Consent> {
  return api.get<Consent>("/v1/admission/consent", { signal })
}
export const consentQuery = () =>
  queryOptions({ queryKey: consentKeys.consent(), queryFn: ({ signal }) => getConsent(signal) })

export type Purpose = { id: string; title: Record<string, string>; text: Record<string, string> }
export const purposesQuery = () =>
  queryOptions({
    queryKey: ["admission", "consent", "purposes"] as const,
    queryFn: ({ signal }) => api.get<{ items: Purpose[] }>("/v1/admission/consent/purposes", { signal }),
    staleTime: 5 * 60_000,
  })

export const putConsent = (purposes: string[]) => api.put<Consent>("/v1/admission/consent", { purposes })
export const deleteConsent = (purpose: string) =>
  api.delete<Consent>(`/v1/admission/consent/${encodeURIComponent(purpose)}`)

export const auditQuery = () =>
  queryOptions({
    queryKey: consentKeys.audit(),
    queryFn: ({ signal }) => api.get<Audit>("/v1/admission/privacy/audit", { signal }),
  })
export const getExport = () => api.get<DataExport>("/v1/admission/privacy/export")
export const eraseData = () => api.delete<Erased>("/v1/admission/privacy/data")

export type AcceptBody = {
  items: { kind: AdmissionLegalKind; version: number; app_scope: LegalScope }[]
  guardian_attested: boolean
}
export const acceptLegal = (body: AcceptBody) => api.post<Pending>("/v1/me/legal/accept", body)
