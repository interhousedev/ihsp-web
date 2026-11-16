// Admission consent, legal re-acceptance and privacy endpoints (shapes follow packages/api/openapi.json).

import {
  type AdmissionAudit,
  type AdmissionConsent,
  type AdmissionDataExport,
  type AdmissionErased,
  type AdmissionPurposeList,
  api,
  keys,
  queryOptions,
} from "@ihsp/api"

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

export type Consent = AdmissionConsent
export type PurposeGrant = Consent["grants"][number]
export type AuditRecord = AdmissionAudit["items"][number]
export type Audit = AdmissionAudit
export type DataExport = AdmissionDataExport
export type Erased = AdmissionErased

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

export type Purpose = AdmissionPurposeList["items"][number]
export const purposesQuery = () =>
  queryOptions({
    queryKey: ["admission", "consent", "purposes"] as const,
    queryFn: ({ signal }) => api.get<AdmissionPurposeList>("/v1/admission/consent/purposes", { signal }),
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
