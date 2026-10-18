// Student certificates: types, entries, files and the staff views. Hand-written until the OpenAPI document has them.

// TODO(contract): replace with generated
export type LocalizedName = { uz: string; ru: string; en: string }

// TODO(contract): replace with generated
export interface CertificateType {
  id: string
  code: string
  name: LocalizedName
  levels: string[]
  asks_level: boolean
  asks_score: boolean
  score_min: number | null
  score_max: number | null
  asks_percent: boolean
  asks_subject: boolean
  asks_year: boolean
  builtin: boolean
  position: number
  custom_fields: CustomField[]
}

export type CustomFieldKind = "text" | "number" | "single" | "multi"

/** A custom input field of a type; choice kinds list `options`, `allow_other` adds free text. */
export interface CustomField {
  key: string
  kind: CustomFieldKind
  label: LocalizedName
  required: boolean
  options: string[]
  allow_other: boolean
}

/** A value of a custom field: text or one choice, a number, or several choices. */
export type CustomValue = string | number | string[]

/** Response of `GET /v1/certificates/staff/fields/{key}/values`. */
export interface CustomFieldValues {
  key: string
  kind: CustomFieldKind
  options: string[]
  /** Free-text choices from the data; every distinct text for a text field. */
  other_values: string[]
  min: number | null
  max: number | null
}

/** Body of `POST /v1/certificates/admin/types`; `PATCH` takes any part of it. */
export type CertificateTypeInput = Omit<CertificateType, "id" | "builtin">

// TODO(contract): replace with generated
export interface CertificateFile {
  id: string
  name: string
  size: number
  content_type: string
}

// TODO(contract): replace with generated
export interface CertificateEntry {
  id: string
  type_id: string
  level: string | null
  score: number | null
  percent: number | null
  subject: string | null
  year: number | null
  serial: string | null
  source: "manual" | "emis"
  issued_at: string | null
  expires_at: string | null
  files: CertificateFile[]
  custom_values: Record<string, CustomValue>
  created_at: string
}

export type CertificateEntryInput = {
  type_id: string
  level?: string | null
  score?: number | null
  percent?: number | null
  subject?: string | null
  year?: number | null
  serial?: string | null
  custom?: Record<string, CustomValue> | null
}

export type CertificateImportResult = { created: number; updated: number; files: number; skipped: number }

export type CertificateStudent = {
  id: string
  name: string
  group_id: string | null
  group_name: string | null
  subgroup: string | null
}

export type StaffCertificateEntry = CertificateEntry & { student: CertificateStudent }

export type CertificateFilters = {
  group_id?: string
  subgroup?: string
  type_id?: string
  subject?: string
  level?: string
  student_id?: string
  q?: string
  /** Custom choice/text filters, sent as repeated `cf_<key>` query params. */
  custom?: Record<string, string[]>
  /** Custom number filters, sent as `cfmin_<key>` / `cfmax_<key>`. */
  ranges?: Record<string, { min?: number | null; max?: number | null }>
}

export type StaffCertificateParams = CertificateFilters & { limit?: number; offset?: number }

export type StaffCertificatePage = { items: StaffCertificateEntry[]; total: number }

export type CertificateStatsGroup = { group_id: string; group_name: string; counts: Record<string, number> }
export type CertificateStatsType = { type_id: string; levels: string[]; groups: CertificateStatsGroup[] }
export type CertificateStats = { types: CertificateStatsType[] }

export type CertificateRankingItem = { student_id: string; name: string; group_name: string | null; count: number }
export type CertificateRanking = { items: CertificateRankingItem[] }

export type CertificateExportBody = { file_ids: string[] } | { filters: CertificateFilters }

export type CertificateGroup = { id: string; name: string; subgroups: string[] }
