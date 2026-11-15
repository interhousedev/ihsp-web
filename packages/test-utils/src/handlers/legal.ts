import type { AcceptLegalBody, LegalDraftBody, LegalKind } from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { adminLegalDocument, adminLegalDocuments, legalDocument, legalDocuments } from "../fixtures/legal"
import { apiUrl, param, query, readJson } from "./utils"

export const legalHandlers = [
  http.get(apiUrl("/v1/legal/documents"), ({ request }) => {
    const locale = query(request).get("locale") ?? "en"
    return HttpResponse.json({ items: legalDocuments.map((doc) => legalDocument(doc.kind, locale, doc.version)) })
  }),
  http.get(apiUrl("/v1/legal/documents/:kind"), ({ params, request }) =>
    HttpResponse.json(legalDocument(param(params, "kind") as LegalKind, query(request).get("locale") ?? "en")),
  ),
  // Nothing pending by default; tests override it.
  http.get(apiUrl("/v1/me/legal/pending"), () => HttpResponse.json({ items: [] })),
  http.post(apiUrl("/v1/me/legal/accept"), async ({ request }) => {
    await readJson<AcceptLegalBody>(request)
    return HttpResponse.json({ items: [] })
  }),
  http.get(apiUrl("/v1/admin/legal/documents"), () => HttpResponse.json({ items: adminLegalDocuments })),
  http.put(apiUrl("/v1/admin/legal/drafts/:kind"), async ({ params, request }) => {
    const body = await readJson<LegalDraftBody>(request)
    const draft = adminLegalDocument(param(params, "kind") as LegalKind, 2, "draft")
    return HttpResponse.json({ ...draft, ...body })
  }),
  http.post(apiUrl("/v1/admin/legal/drafts/:kind/publish"), ({ params }) =>
    HttpResponse.json(adminLegalDocument(param(params, "kind") as LegalKind, 2, "published")),
  ),
  http.get(apiUrl("/v1/admin/legal/acceptances"), () =>
    HttpResponse.json({
      items: [
        { kind: "privacy", version: 1, accepted_count: 120 },
        { kind: "terms", version: 1, accepted_count: 118 },
      ],
    }),
  ),
]
