import type { AdminLegalDocument, LegalDocument, LegalKind, PendingLegalItem } from "@ihsp/api"

const KINDS: readonly LegalKind[] = ["privacy", "terms", "biometric", "ai"]

/** `GET /v1/legal/documents`: the four published documents, version 1, in the requested locale. */
export function legalDocument(kind: LegalKind, locale = "en", version = 1): LegalDocument {
  return {
    kind,
    app_scope: "global",
    version,
    locale,
    title: `Document ${kind}`,
    body_markdown: `## Rules of ${kind}\n\nBody text of ${kind}.`,
    announcement: null,
    published_at: "2026-01-10T09:00:00Z",
  }
}

export const legalDocuments: LegalDocument[] = KINDS.map((kind) => legalDocument(kind))

/** A pending re-accept item: version 2 over an accepted version 1. */
export function pendingLegalItem(kind: LegalKind = "privacy"): PendingLegalItem {
  return {
    ...legalDocument(kind, "en", 2),
    announcement: `What changed in ${kind}`,
    previously_accepted_version: 1,
  }
}

export function adminLegalDocument(
  kind: LegalKind,
  version: number,
  status: "draft" | "published",
): AdminLegalDocument {
  const perLocale = (text: string) => ({ uz: `${text} uz`, ru: `${text} ru`, en: `${text} en` })
  return {
    id: `00000000-0000-4000-8000-0000000000${KINDS.indexOf(kind)}${version}`,
    kind,
    app_scope: "global",
    version,
    status,
    title: perLocale(`Title ${kind}`),
    body_markdown: perLocale(`Body ${kind}`),
    announcement: status === "draft" ? perLocale(`News ${kind}`) : null,
    created_at: "2026-01-01T09:00:00Z",
    updated_at: "2026-01-02T09:00:00Z",
    published_at: status === "published" ? "2026-01-10T09:00:00Z" : null,
    published_by: status === "published" ? "00000000-0000-4000-8000-000000000001" : null,
  }
}

/** Every kind has a published version 1; `privacy` also has a draft version 2; one document is admission-only. */
export const adminLegalDocuments: AdminLegalDocument[] = [
  adminLegalDocument("privacy", 2, "draft"),
  ...KINDS.map((kind) => adminLegalDocument(kind, 1, "published")),
  {
    ...adminLegalDocument("privacy", 1, "published"),
    id: "00000000-0000-4000-8000-000000000099",
    kind: "admission_privacy",
    app_scope: "admission",
    title: { uz: "Admission privacy uz", ru: "Admission privacy ru", en: "Admission privacy en" },
  },
]
