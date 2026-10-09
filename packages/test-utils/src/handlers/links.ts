import type {
  LinkCreateBody,
  LinkDisableBody,
  LinkItem,
  ResourceCreateBody,
  ResourceHideBody,
  ResourceItem,
  ShareCreateBody,
} from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { fileItems } from "../fixtures/files"
import { linkItems, linkUrl, moderationItems, resourceItems } from "../fixtures/links"
import { FIXTURE_NOW, persons } from "../fixtures/world"
import { apiUrl, matches, nextId, noContent, notFound, paginate, param, query, readJson } from "./utils"

function slugFor(id: string): string {
  return id.slice(-6)
}

export const linksHandlers = [
  http.post(apiUrl("/v1/links"), async ({ request }) => {
    const body = await readJson<LinkCreateBody>(request)
    const id = nextId(9)
    const file = body.file_id ? (fileItems.find((item) => item.id === body.file_id) ?? null) : null
    const link: LinkItem = {
      ...linkUrl,
      id,
      slug: slugFor(id),
      kind: body.kind ?? "url",
      url: `http://localhost:8000/s/${slugFor(id)}`,
      target_url: body.kind === "file" ? null : (body.target_url ?? null),
      file,
      title: file?.name ?? body.target_url ?? null,
      hits: 0,
      created_at: FIXTURE_NOW,
    }
    return HttpResponse.json(link)
  }),
  http.get(apiUrl("/v1/me/links"), ({ request }) => {
    const kind = query(request).get("kind")
    const targetId = query(request).get("target_id")
    return HttpResponse.json(
      paginate(
        linkItems.filter((item) => (!kind || item.kind === kind) && (!targetId || item.target_id === targetId)),
        request,
      ),
    )
  }),
  http.delete(apiUrl("/v1/links/:id"), () => noContent()),
  http.post(apiUrl("/v1/shares"), async ({ request }) => {
    const body = await readJson<ShareCreateBody>(request)
    const id = nextId(9)
    const link: LinkItem = {
      ...linkUrl,
      id,
      slug: slugFor(id),
      kind: body.kind ?? "chat",
      url: `http://localhost:3006/ai/${slugFor(id)}`,
      target_url: null,
      target_id: body.target_id ?? null,
      title: body.kind === "flashcard_set" ? "Physics: kinematics" : "Kinematics revision",
      share_mode: body.share_mode ?? "snapshot",
      hits: 0,
      created_at: FIXTURE_NOW,
      expires_at: body.expires_at ?? null,
    }
    return HttpResponse.json(link)
  }),
  http.post(apiUrl("/v1/links/:id/revoke"), ({ params }) => {
    const link = linkItems.find((item) => item.id === param(params, "id"))
    return link ? HttpResponse.json({ ...link, revoked_at: FIXTURE_NOW }) : notFound("Link")
  }),

  // --- Lesson resources (the materials and attachments of the lessons of the fixture week) ---
  http.get(apiUrl("/v1/lessons/:lessonId/resources"), ({ params }) => {
    const lessonId = param(params, "lessonId")
    return HttpResponse.json(resourceItems.filter((item) => item.lesson_id === lessonId))
  }),
  http.post(apiUrl("/v1/lessons/:lessonId/resources"), async ({ params, request }) => {
    const body = await readJson<ResourceCreateBody>(request)
    const lessonIds = [param(params, "lessonId"), ...(body.also_lesson_ids ?? [])]
    const created = lessonIds.map((lessonId): ResourceItem => {
      const id = nextId(9)
      const file = body.file_id ? (fileItems.find((item) => item.id === body.file_id) ?? null) : null
      return {
        link_id: id,
        lesson_id: lessonId,
        role: body.role ?? "attachment",
        kind: body.kind ?? "url",
        short_url: `http://localhost:8000/s/${slugFor(id)}`,
        title: file?.name ?? body.target_url ?? "Resource",
        author: persons.student,
        hidden: false,
        file,
        created_at: FIXTURE_NOW,
        source: "user",
      }
    })
    return HttpResponse.json(created)
  }),
  http.delete(apiUrl("/v1/lessons/:lessonId/resources/:linkId"), () => noContent()),
  http.post(apiUrl("/v1/lessons/:lessonId/resources/:linkId/hide"), async ({ params, request }) => {
    const resource = resourceItems.find((item) => item.link_id === param(params, "linkId"))
    if (!resource) return notFound("Resource")
    const body = await readJson<ResourceHideBody>(request)
    return HttpResponse.json({ ...resource, hidden: body.hidden ?? true })
  }),

  // --- Moderation ---
  http.get(apiUrl("/v1/admin/moderation/queue"), ({ request }) =>
    HttpResponse.json(
      paginate(
        moderationItems.filter((item) => item.reports > 0),
        request,
      ),
    ),
  ),
  http.get(apiUrl("/v1/admin/moderation/search"), ({ request }) => {
    const needle = query(request).get("q")
    return HttpResponse.json(
      moderationItems.filter(
        (item) =>
          matches(item.link.slug, needle) ||
          matches(item.link.url, needle) ||
          matches(`${item.owner.first_name} ${item.owner.last_name}`, needle),
      ),
    )
  }),
  http.post(apiUrl("/v1/admin/links/:id/disable"), async ({ params, request }) => {
    const item = moderationItems.find((entry) => entry.link.id === param(params, "id"))
    if (!item) return notFound("Link")
    const body = await readJson<LinkDisableBody>(request)
    return HttpResponse.json({ ...item, link: { ...item.link, disabled: true }, disabled_reason: body.reason ?? null })
  }),
  http.post(apiUrl("/v1/admin/links/:id/dismiss-reports"), ({ params }) => {
    const item = moderationItems.find((entry) => entry.link.id === param(params, "id"))
    return item ? HttpResponse.json({ ...item, reports: 0 }) : notFound("Link")
  }),
]
