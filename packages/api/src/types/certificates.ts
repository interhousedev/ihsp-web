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
