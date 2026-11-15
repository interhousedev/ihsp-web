import type { RejectErasureBody } from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { adminErasureRequests, dataExport, erasureRequest } from "../fixtures/privacy"
import { apiUrl, param, readJson } from "./utils"

export const privacyHandlers = [
  http.get(apiUrl("/v1/me/privacy/exports"), () => HttpResponse.json({ items: [] })),
  http.post(apiUrl("/v1/me/privacy/exports"), () =>
    HttpResponse.json(dataExport({ status: "queued", finished_at: null, expires_at: null, byte_size: null }), {
      status: 202,
    }),
  ),
  http.get(apiUrl("/v1/me/privacy/exports/:id/download"), () =>
    HttpResponse.json({ url: "https://files.example.test/export.zip", expires_in: 60 }),
  ),
  http.get(apiUrl("/v1/me/privacy/erasure"), () => HttpResponse.json({ request: null })),
  http.delete(apiUrl("/v1/me/privacy/erasure"), () => HttpResponse.json(erasureRequest({ status: "cancelled" }))),
  http.get(apiUrl("/v1/admin/privacy/erasure-requests"), () => HttpResponse.json({ items: adminErasureRequests })),
  http.post(apiUrl("/v1/admin/privacy/erasure-requests/:id/approve"), ({ params }) =>
    HttpResponse.json(
      erasureRequest({ id: param(params, "id"), status: "approved", decided_at: "2026-11-15T10:00:00Z" }),
    ),
  ),
  http.post(apiUrl("/v1/admin/privacy/erasure-requests/:id/reject"), async ({ params, request }) => {
    const body = await readJson<RejectErasureBody>(request)
    return HttpResponse.json(
      erasureRequest({
        id: param(params, "id"),
        status: "rejected",
        decided_at: "2026-11-15T10:00:00Z",
        reject_reason: body.reason ?? null,
      }),
    )
  }),
]
