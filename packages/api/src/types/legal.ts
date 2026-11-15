// Legal documents: public texts, the re-accept gate and the admin editor (tag `legal`).

export type LegalKind = "privacy" | "terms" | "biometric" | "ai"
export type LegalLocale = "uz" | "ru" | "en"

export const LEGAL_KINDS: readonly LegalKind[] = ["privacy", "terms", "biometric", "ai"]

export type LegalDocument = {
  kind: LegalKind
  version: number
  locale: string
  title: string
  body_markdown: string
  announcement: string | null
  published_at: string | null
}
export type LegalDocumentList = { items: LegalDocument[] }

export type PendingLegalItem = LegalDocument & { previously_accepted_version: number | null }
export type PendingLegal = { items: PendingLegalItem[] }

export type LegalAcceptItem = { kind: LegalKind; version: number }
export type AcceptLegalBody = { items: LegalAcceptItem[] }

type PerLocale = Record<string, string>

export type AdminLegalDocument = {
  id: string
  kind: LegalKind
  version: number
  status: "draft" | "published"
  title: PerLocale
  body_markdown: PerLocale
  announcement: PerLocale | null
  created_at: string
  updated_at: string
  published_at: string | null
  published_by: string | null
}
export type AdminLegalDocumentList = { items: AdminLegalDocument[] }

export type LegalDraftBody = {
  title?: PerLocale
  body_markdown?: PerLocale
  announcement?: PerLocale | null
}

export type LegalAcceptanceCount = { kind: LegalKind; version: number; accepted_count: number }
export type LegalAcceptanceCounts = { items: LegalAcceptanceCount[] }
