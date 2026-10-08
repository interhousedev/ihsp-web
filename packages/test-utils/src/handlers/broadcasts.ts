import type { AudienceCountBody, BroadcastInput, BroadcastPatchBody, BroadcastSendBody } from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { audienceCountFor, audienceEveryone, broadcastDraft, broadcastItems } from "../fixtures/broadcasts"
import { FIXTURE_NOW } from "../fixtures/world"
import { apiUrl, nextId, noContent, notFound, paginate, param, query, readJson } from "./utils"

export const broadcastsHandlers = [
  http.get(apiUrl("/v1/admin/broadcasts"), ({ request }) => {
    const status = query(request).get("status")
    return HttpResponse.json(
      paginate(
        broadcastItems.filter((item) => !status || item.status === status),
        request,
      ),
    )
  }),
  http.post(apiUrl("/v1/admin/broadcasts/audience-count"), async ({ request }) => {
    const body = await readJson<AudienceCountBody>(request)
    return HttpResponse.json({ count: audienceCountFor(body.audience ?? audienceEveryone) })
  }),
  http.post(apiUrl("/v1/admin/broadcasts"), async ({ request }) => {
    const body = await readJson<BroadcastInput>(request)
    return HttpResponse.json({
      ...broadcastDraft,
      id: nextId(13),
      title: body.title ?? "",
      text: body.text ?? "",
      media_file_ids: body.media_file_ids ?? [],
      audience: body.audience ?? audienceEveryone,
      status: "draft",
      created_at: FIXTURE_NOW,
    })
  }),
  http.get(apiUrl("/v1/admin/broadcasts/:id"), ({ params }) => {
    const item = broadcastItems.find((entry) => entry.id === param(params, "id"))
    return item ? HttpResponse.json(item) : notFound("Broadcast")
  }),
  http.patch(apiUrl("/v1/admin/broadcasts/:id"), async ({ params, request }) => {
    const item = broadcastItems.find((entry) => entry.id === param(params, "id"))
    if (!item) return notFound("Broadcast")
    const body = await readJson<BroadcastPatchBody>(request)
    return HttpResponse.json({ ...item, ...body })
  }),
  http.post(apiUrl("/v1/admin/broadcasts/:id/preview"), () => noContent()),
  http.post(apiUrl("/v1/admin/broadcasts/:id/send"), async ({ params, request }) => {
    const item = broadcastItems.find((entry) => entry.id === param(params, "id"))
    if (!item) return notFound("Broadcast")
    const body = await readJson<BroadcastSendBody>(request)
    return HttpResponse.json({
      ...item,
      status: body.scheduled_at ? "scheduled" : "sending",
      scheduled_at: body.scheduled_at ?? null,
    })
  }),
  http.post(apiUrl("/v1/admin/broadcasts/:id/cancel"), ({ params }) => {
    const item = broadcastItems.find((entry) => entry.id === param(params, "id"))
    return item ? HttpResponse.json({ ...item, status: "cancelled" }) : notFound("Broadcast")
  }),
]
