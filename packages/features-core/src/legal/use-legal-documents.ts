"use client"

import { getLegalDocumentQuery, getLegalDocumentsQuery, type LegalKind } from "@ihsp/api"
import { useLocale } from "@ihsp/i18n"
import { useQuery } from "@tanstack/react-query"

/** The published documents (all four kinds) in the interface language. */
export function useLegalDocuments() {
  const locale = useLocale()
  return useQuery(getLegalDocumentsQuery(locale))
}

/** One published document in the interface language. */
export function useLegalDocument(kind: LegalKind) {
  const locale = useLocale()
  return useQuery(getLegalDocumentQuery(kind, locale))
}

/** Public address of a document page; the pages live in the id app, so the link is absolute. */
export function legalHref(idUrl: string, kind: LegalKind): string {
  return `${idUrl.replace(/\/$/, "")}/legal/${kind}/`
}
