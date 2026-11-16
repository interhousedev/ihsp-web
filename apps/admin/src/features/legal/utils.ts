import {
  ALL_LEGAL_KINDS,
  LEGAL_KINDS,
  LEGAL_SCOPES,
  type AdminLegalDocument,
  type LegalAcceptanceCount,
  type LegalKind,
  type LegalScope,
} from "@ihsp/api"

export const LEGAL_LOCALES = ["uz", "ru", "en"] as const
export type LegalEditorLocale = (typeof LEGAL_LOCALES)[number]

export type LegalKindState = {
  kind: LegalKind
  scope: LegalScope
  published: AdminLegalDocument | null
  draft: AdminLegalDocument | null
  accepted: number | null
}

/** A document without `app_scope` (an older backend) is global. */
export function scopeOf(item: { app_scope?: LegalScope }): LegalScope {
  return item.app_scope ?? "global"
}

/** The newest published version, the open draft and the acceptances of the published version, per kind and app. */
export function kindState(
  kind: LegalKind,
  scope: LegalScope,
  documents: readonly AdminLegalDocument[],
  acceptances: readonly LegalAcceptanceCount[],
): LegalKindState {
  const own = documents.filter((document) => document.kind === kind && scopeOf(document) === scope)
  const published = own
    .filter((document) => document.status === "published")
    .toSorted((a, b) => b.version - a.version)[0]
  const draft = own.find((document) => document.status === "draft") ?? null
  const count = published
    ? acceptances.find((item) => item.kind === kind && scopeOf(item) === scope && item.version === published.version)
    : undefined
  return { kind, scope, published: published ?? null, draft, accepted: count?.accepted_count ?? (published ? 0 : null) }
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

export type LegalRow = { kind: LegalKind; scope: LegalScope }

const ADMISSION_KINDS = ALL_LEGAL_KINDS.filter((kind) => !(LEGAL_KINDS as readonly LegalKind[]).includes(kind))

/**
 * The (kind, app) pairs to show. One app lists the four common kinds, the admission kinds for the admission app and
 * every other document of that app; all apps list the global kinds and every document that exists.
 */
export function legalRows(filter: LegalScope | "", documents: readonly AdminLegalDocument[]): LegalRow[] {
  const rows = new Map<string, LegalRow>()
  const add = (kind: LegalKind, scope: LegalScope) => rows.set(`${scope}:${kind}`, { kind, scope })
  const scope = filter === "" ? "global" : filter
  for (const kind of LEGAL_KINDS) add(kind, scope)
  if (scope === "admission") for (const kind of ADMISSION_KINDS) add(kind, scope)
  for (const document of documents)
    if (filter === "" || scopeOf(document) === filter) add(document.kind, scopeOf(document))
  return [...rows.values()].toSorted(
    (a, b) =>
      LEGAL_SCOPES.indexOf(a.scope) - LEGAL_SCOPES.indexOf(b.scope) ||
      ALL_LEGAL_KINDS.indexOf(a.kind) - ALL_LEGAL_KINDS.indexOf(b.kind),
  )
}
