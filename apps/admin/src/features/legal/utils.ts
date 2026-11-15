import type { AdminLegalDocument, LegalAcceptanceCount, LegalKind } from "@ihsp/api"

export const LEGAL_LOCALES = ["uz", "ru", "en"] as const
export type LegalEditorLocale = (typeof LEGAL_LOCALES)[number]

export type LegalKindState = {
  kind: LegalKind
  published: AdminLegalDocument | null
  draft: AdminLegalDocument | null
  accepted: number | null
}

/** The newest published version, the open draft and the acceptances of the published version, per kind. */
export function kindState(
  kind: LegalKind,
  documents: readonly AdminLegalDocument[],
  acceptances: readonly LegalAcceptanceCount[],
): LegalKindState {
  const own = documents.filter((document) => document.kind === kind)
  const published = own
    .filter((document) => document.status === "published")
    .toSorted((a, b) => b.version - a.version)[0]
  const draft = own.find((document) => document.status === "draft") ?? null
  const count = published
    ? acceptances.find((item) => item.kind === kind && item.version === published.version)
    : undefined
  return { kind, published: published ?? null, draft, accepted: count?.accepted_count ?? (published ? 0 : null) }
}

export type LegalForm = Record<"title" | "body" | "announcement", Record<LegalEditorLocale, string>>

/** The draft when there is one, otherwise the published text to start the next version from. */
export function formFrom(source: AdminLegalDocument | null): LegalForm {
  const pick = (map: Record<string, string> | null | undefined) => ({
    uz: map?.uz ?? "",
    ru: map?.ru ?? "",
    en: map?.en ?? "",
  })
  return { title: pick(source?.title), body: pick(source?.body_markdown), announcement: pick(source?.announcement) }
}
