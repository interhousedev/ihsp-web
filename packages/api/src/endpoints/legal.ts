// Legal documents: public texts, the re-accept gate and the admin editor.

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, seg, type RequestOptions } from "../query"
import type {
  AcceptLegalBody,
  AdminLegalDocument,
  AdminLegalDocumentList,
  LegalAcceptanceCounts,
  LegalDocument,
  LegalDocumentList,
  LegalDraftBody,
  LegalKind,
  LegalScope,
  PendingLegal,
} from "../types/legal"

/** GET /v1/legal/documents?locale — public; the current published version of every kind. */
export function getLegalDocuments(locale: string, opts?: RequestOptions): Promise<LegalDocumentList> {
  return api.get<LegalDocumentList>("/v1/legal/documents", { auth: "none", ...opts, query: { locale } })
}
export const getLegalDocumentsQuery = (locale: string) =>
  queryOptions({
    queryKey: keys.legal.documents(locale),
    queryFn: ({ signal }) => getLegalDocuments(locale, { signal }),
  })

/** GET /v1/legal/documents/{kind}?locale — public; one published document. */
export function getLegalDocument(kind: LegalKind, locale: string, opts?: RequestOptions): Promise<LegalDocument> {
  return api.get<LegalDocument>(`/v1/legal/documents/${seg(kind)}`, { auth: "none", ...opts, query: { locale } })
}
export const getLegalDocumentQuery = (kind: LegalKind, locale: string) =>
  queryOptions({
    queryKey: keys.legal.document(kind, locale),
    queryFn: ({ signal }) => getLegalDocument(kind, locale, { signal }),
  })

/** GET /v1/me/legal/pending — bearer; published versions the user has not accepted yet. */
export function getMeLegalPending(opts?: RequestOptions): Promise<PendingLegal> {
  return api.get<PendingLegal>("/v1/me/legal/pending", opts)
}
export const getMeLegalPendingQuery = () =>
  queryOptions({
    queryKey: keys.legal.pending(),
    queryFn: ({ signal }) => getMeLegalPending({ signal }),
  })

/** POST /v1/me/legal/accept — bearer; answers with the list still pending; `409 legal/stale-version` when a newer version was published. */
export function postMeLegalAccept(body: AcceptLegalBody, opts?: RequestOptions): Promise<PendingLegal> {
  return api.post<PendingLegal>("/v1/me/legal/accept", body, opts)
}

/** GET /v1/admin/legal/documents — admin; every version of every kind. */
export function getAdminLegalDocuments(opts?: RequestOptions): Promise<AdminLegalDocumentList> {
  return api.get<AdminLegalDocumentList>("/v1/admin/legal/documents", opts)
}
export const getAdminLegalDocumentsQuery = () =>
  queryOptions({
    queryKey: keys.legal.admin(),
    queryFn: ({ signal }) => getAdminLegalDocuments({ signal }),
  })

/** PUT /v1/admin/legal/drafts/{kind} — admin; creates or updates the draft. */
export function putAdminLegalDraft(
  kind: LegalKind,
  body: LegalDraftBody,
  appScope: LegalScope = "global",
  opts?: RequestOptions,
): Promise<AdminLegalDocument> {
  return api.put<AdminLegalDocument>(`/v1/admin/legal/drafts/${seg(kind)}`, body, {
    ...opts,
    query: { app_scope: appScope },
  })
}

/** POST /v1/admin/legal/drafts/{kind}/publish — admin; `422 legal/incomplete` when a locale is missing. */
export function postAdminLegalPublish(
  kind: LegalKind,
  appScope: LegalScope = "global",
  opts?: RequestOptions,
): Promise<AdminLegalDocument> {
  return api.post<AdminLegalDocument>(`/v1/admin/legal/drafts/${seg(kind)}/publish`, undefined, {
    ...opts,
    query: { app_scope: appScope },
  })
}

/** GET /v1/admin/legal/acceptances — admin; accepted counts per kind and version. */
export function getAdminLegalAcceptances(opts?: RequestOptions): Promise<LegalAcceptanceCounts> {
  return api.get<LegalAcceptanceCounts>("/v1/admin/legal/acceptances", opts)
}
export const getAdminLegalAcceptancesQuery = () =>
  queryOptions({
    queryKey: keys.legal.acceptances(),
    queryFn: ({ signal }) => getAdminLegalAcceptances({ signal }),
  })
