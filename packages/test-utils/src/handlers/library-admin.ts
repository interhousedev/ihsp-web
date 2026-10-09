// Library handlers, part 6: topics and collections of the librarian area, statistics and sanctions.

import type {
  CollectionInput,
  ItemStatus,
  LibraryStats,
  ManageCollection,
  ManageTopic,
  Sanction,
  SanctionBody,
  TopicInput,
} from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { TEST_STORAGE_URL } from "../fixtures/env"
import { libStats } from "../fixtures/library"
import { adminOnly, invalid, itemNotFound, newId, stamp, staffOnly, state, subjectRef } from "./library-state"
import { apiUrl, noContent, param, problem, query, readJson } from "./utils"

const SANCTION_KINDS = ["warning", "upload_ban"]

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

const hasNames = (name: { uz?: string; ru?: string; en?: string } | undefined) =>
  !!name?.uz?.trim() && !!name.ru?.trim() && !!name.en?.trim()

function notFound(what: string): Response {
  return problem(404, "library/not-found", `${what} not found`)
}

/** The topic and everything below it. */
function subtree(rootId: string): Set<string> {
  const ids = new Set([rootId])
  let grew = true
  while (grew) {
    grew = false
    for (const t of state.topics) {
      if (t.parent_id && ids.has(t.parent_id) && !ids.has(t.id)) {
        ids.add(t.id)
        grew = true
      }
    }
  }
  return ids
}

function statsNow(): LibraryStats {
  const byStatus: Partial<Record<ItemStatus, number>> = {}
  for (const s of state.items.values()) {
    if (s.detail.kind === "external") continue
    byStatus[s.detail.status] = (byStatus[s.detail.status] ?? 0) + 1
  }
  const reportsByReason: LibraryStats["reports_by_reason"] = {}
  for (const r of state.reports) {
    if (r.resolved) continue
    const reason = r.reason as keyof LibraryStats["reports_by_reason"]
    reportsByReason[reason] = (reportsByReason[reason] ?? 0) + 1
  }
  return {
    ...libStats,
    queue: { ...libStats.queue, length: byStatus.pending_review ?? 0 },
    items_by_status: byStatus,
    reports_by_reason: reportsByReason,
  }
}

export const libraryAdminHandlers = [
  // --- Topics ---
  http.get(apiUrl("/v1/manage/library/topics"), ({ request }) => {
    const actor = staffOnly(request)
    if (actor instanceof Response) return actor
    const subjectId = query(request).get("subject_id")
    const topics = state.topics.filter((t) => !subjectId || t.subject_id === subjectId)
    return HttpResponse.json([...topics].toSorted((a, b) => a.position - b.position))
  }),

  http.post(apiUrl("/v1/manage/library/topics"), async ({ request }) => {
    const actor = staffOnly(request)
    if (actor instanceof Response) return actor
    const body = await readJson<TopicInput>(request)
    if (!subjectRef(body.subject_id)) return invalid("subject_id", "Unknown subject")
    if (!hasNames(body.name)) return invalid("name", "Names in uz, ru and en are required")
    const parent = body.parent_id ? state.topics.find((t) => t.id === body.parent_id) : null
    if (body.parent_id && (!parent || parent.subject_id !== body.subject_id)) {
      return invalid("parent_id", "The parent topic must belong to the same subject")
    }
    const topic: ManageTopic = {
      id: newId(),
      subject_id: body.subject_id ?? "",
      parent_id: parent?.id ?? null,
      name: body.name as ManageTopic["name"],
      slug: body.slug ?? slugify(body.name?.en ?? ""),
      position: Math.max(0, ...state.topics.map((t) => t.position)) + 1,
      year_of_study: body.year_of_study ?? null,
    }
    state.topics.push(topic)
    return HttpResponse.json(topic, { status: 201 })
  }),

  http.patch(apiUrl("/v1/manage/library/topics/:id"), async ({ params, request }) => {
    const actor = staffOnly(request)
    if (actor instanceof Response) return actor
    const index = state.topics.findIndex((t) => t.id === param(params, "id"))
    const current = state.topics[index]
    if (!current) return notFound("Topic")
    const body = await readJson<Partial<TopicInput>>(request)
    if (body.name !== undefined && !hasNames(body.name)) return invalid("name", "Names in uz, ru and en are required")
    const next: ManageTopic = {
      ...current,
      name: body.name ?? current.name,
      slug: body.slug ?? current.slug,
      parent_id: body.parent_id === undefined ? current.parent_id : body.parent_id,
      year_of_study: body.year_of_study === undefined ? current.year_of_study : body.year_of_study,
    }
    state.topics[index] = next
    return HttpResponse.json(next)
  }),

  /** Deletes the topic and its children; items lose the topic tag. */
  http.delete(apiUrl("/v1/manage/library/topics/:id"), ({ params, request }) => {
    const actor = staffOnly(request)
    if (actor instanceof Response) return actor
    const id = param(params, "id")
    if (!state.topics.some((t) => t.id === id)) return notFound("Topic")
    const gone = subtree(id)
    state.topics = state.topics.filter((t) => !gone.has(t.id))
    for (const stored of state.items.values()) {
      stored.detail = { ...stored.detail, topics: stored.detail.topics.filter((t) => !gone.has(t.id)) }
    }
    return noContent()
  }),

  // --- Collections ---
  http.get(apiUrl("/v1/manage/library/collections"), ({ request }) => {
    const actor = staffOnly(request)
    if (actor instanceof Response) return actor
    return HttpResponse.json([...state.collections].toSorted((a, b) => a.position - b.position))
  }),

  http.post(apiUrl("/v1/manage/library/collections"), async ({ request }) => {
    const actor = staffOnly(request)
    if (actor instanceof Response) return actor
    const body = await readJson<CollectionInput>(request)
    if (!body.title?.en?.trim()) return invalid("title", "A title is required")
    for (const id of body.item_ids ?? []) if (!state.items.has(id)) return itemNotFound()
    const collection: ManageCollection = {
      id: newId(),
      slug: slugify(body.title.en),
      title: body.title,
      description: body.description ?? null,
      cover_url: body.cover_file_id ? `${TEST_STORAGE_URL}/library/covers/${body.cover_file_id}.jpg` : null,
      published: body.published ?? false,
      position: Math.max(0, ...state.collections.map((c) => c.position)) + 1,
      item_ids: body.item_ids ?? [],
    }
    state.collections.push(collection)
    return HttpResponse.json(collection, { status: 201 })
  }),

  http.patch(apiUrl("/v1/manage/library/collections/:id"), async ({ params, request }) => {
    const actor = staffOnly(request)
    if (actor instanceof Response) return actor
    const index = state.collections.findIndex((c) => c.id === param(params, "id"))
    const current = state.collections[index]
    if (!current) return notFound("Collection")
    const body = await readJson<Partial<CollectionInput>>(request)
    for (const id of body.item_ids ?? []) if (!state.items.has(id)) return itemNotFound()
    const next: ManageCollection = {
      ...current,
      title: body.title ?? current.title,
      description: body.description === undefined ? current.description : body.description,
      cover_url:
        body.cover_file_id === undefined
          ? current.cover_url
          : body.cover_file_id
            ? `${TEST_STORAGE_URL}/library/covers/${body.cover_file_id}.jpg`
            : null,
      published: body.published ?? current.published,
      item_ids: body.item_ids ?? current.item_ids,
    }
    state.collections[index] = next
    return HttpResponse.json(next)
  }),

  http.delete(apiUrl("/v1/manage/library/collections/:id"), ({ params, request }) => {
    const actor = staffOnly(request)
    if (actor instanceof Response) return actor
    const before = state.collections.length
    state.collections = state.collections.filter((c) => c.id !== param(params, "id"))
    return state.collections.length === before ? notFound("Collection") : noContent()
  }),

  // --- Statistics ---
  http.get(apiUrl("/v1/manage/library/stats"), ({ request }) => {
    const actor = staffOnly(request)
    return actor instanceof Response ? actor : HttpResponse.json(statsNow())
  }),

  // --- Sanctions (administration) ---
  http.get(apiUrl("/v1/admin/library/sanctions"), ({ request }) => {
    const actor = adminOnly(request)
    if (actor instanceof Response) return actor
    const userId = query(request).get("user_id")
    return HttpResponse.json(state.sanctions.filter((s) => !userId || s.user_id === userId))
  }),

  http.post(apiUrl("/v1/admin/library/sanctions"), async ({ request }) => {
    const actor = adminOnly(request)
    if (actor instanceof Response) return actor
    const body = await readJson<SanctionBody>(request)
    if (!body.user_id) return invalid("user_id", "user_id is required")
    if (!body.kind || !SANCTION_KINDS.includes(body.kind)) return invalid("kind", "kind must be warning or upload_ban")
    if (!body.reason?.trim()) return invalid("reason", "A reason is required")
    const sanction: Sanction = {
      id: newId(),
      user_id: body.user_id,
      kind: body.kind,
      until: body.until ?? null,
      reason: body.reason,
      item_id: null,
      created_at: stamp(),
    }
    state.sanctions.push(sanction)
    return HttpResponse.json(sanction, { status: 201 })
  }),
]
