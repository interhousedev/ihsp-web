// Library handlers, part 1: catalogue (anon routes), item files and text, topics, collections and reading lists.

import type {
  Collection,
  CollectionDetail,
  ItemCard,
  ItemFileUrl,
  ItemText,
  ReadingListCard,
  ReadingListDetail,
  ReadingListInput,
  ReadingListItemInput,
} from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { TEST_STORAGE_URL } from "../fixtures/env"
import {
  isLibraryStaff,
  libPdfBytes,
  libSubjects,
  libraryCan,
  subjectCounts,
  topicTree,
  type LibraryActor,
} from "../fixtures/library"
import {
  actorOf,
  canEditList,
  canSee,
  cardFor,
  detailFor,
  forbidden,
  invalid,
  isUzbek,
  itemNotFound,
  listDetailFor,
  listVisible,
  newId,
  notSupported,
  signedIn,
  snippetOf,
  stamp,
  state,
  subjectRef,
  textMatches,
  visibleItem,
  type StoredItem,
  type StoredList,
} from "./library-state"
import { apiUrl, noContent, paginate, param, problem, query, readJson } from "./utils"

const FILE_LINK_EXPIRES = "2026-10-07T05:27:00Z"
const MAX_LIST_ENTRIES = 100

const CONTENT_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  epub: "application/epub+zip",
  md: "text/markdown; charset=utf-8",
  txt: "text/plain; charset=utf-8",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
}

// - - - Search - - -

/** Items the catalogue lists: published, not hidden, visible to the caller; UniLibrary records only while enabled. */
function catalogueOf(actor: LibraryActor | null): StoredItem[] {
  return [...state.items.values()].filter((s) => {
    const d = s.detail
    if (d.status !== "published" || d.visibility === "hidden" || d.external?.gone) return false
    return canSee(actor, s)
  })
}

type Hit = { stored: StoredItem; score: number; snippet: { snippet: string; page: number } | null }

function matchQuery(stored: StoredItem, q: string): Hit | null {
  const d = stored.detail
  const uzbek = isUzbek(d.language)
  const title = textMatches(d.title, q, uzbek) || textMatches(d.subtitle ?? "", q, uzbek)
  const author = textMatches(d.author_label, q, uzbek)
  const description = textMatches(d.description ?? "", q, uzbek)
  const snippet = d.kind === "external" ? null : snippetOf(stored, q)
  const score = (title ? 4 : 0) + (author ? 3 : 0) + (description ? 1 : 0) + (snippet ? 1 : 0)
  return score > 0 ? { stored, score, snippet } : null
}

function inCollection(collectionId: string, stored: StoredItem): boolean {
  const collection = state.collections.find((c) => c.id === collectionId || c.slug === collectionId)
  return !!collection && !!stored.detail.id && collection.item_ids.includes(stored.detail.id)
}

function filterByParams(actor: LibraryActor | null, search: URLSearchParams, rows: StoredItem[]): StoredItem[] {
  const source = search.get("source") ?? "all"
  const subjectId = search.get("subject_id")
  const topicId = search.get("topic_id")
  const year = search.get("year_of_study")
  const type = search.get("type")
  const language = search.get("language")
  const collectionId = search.get("collection_id")
  const uploaderRole = search.get("uploader_role")
  const hasText = search.get("has_text")
  const shelf = search.get("shelf")
  const user = actor ? state.users.get(actor.id) : undefined
  return rows.filter((s) => {
    const d = s.detail
    if (source !== "all" && d.kind !== source) return false
    if (subjectId && !d.subjects.some((x) => x.id === subjectId)) return false
    if (topicId && !d.topics.some((x) => x.id === topicId)) return false
    if (year && !d.years_of_study.includes(Number(year))) return false
    if (type && d.type !== type) return false
    if (language && d.language !== language) return false
    if (collectionId && !inCollection(collectionId, s)) return false
    if (uploaderRole && d.material?.uploader_role !== uploaderRole) return false
    if (hasText === "true" || hasText === "1") {
      if (!d.has_text) return false
    } else if (hasText === "false" || hasText === "0") {
      if (d.has_text) return false
    }
    if (shelf) {
      const row = d.id ? user?.shelf.get(d.id) : undefined
      if (!row || (shelf !== "any" && row.state !== shelf)) return false
    }
    return true
  })
}

function sortHits(hits: Hit[], sort: string): Hit[] {
  const by = (a: Hit, b: Hit): number => {
    if (sort === "title") return a.stored.detail.title.localeCompare(b.stored.detail.title)
    if (sort === "author") return a.stored.detail.author_label.localeCompare(b.stored.detail.author_label)
    if (sort === "relevance" && a.score !== b.score) return b.score - a.score
    return (
      b.stored.addedAt.localeCompare(a.stored.addedAt) || a.stored.detail.title.localeCompare(b.stored.detail.title)
    )
  }
  return [...hits].toSorted(by)
}

/** Cards for `GET /library/items` before pagination. */
export function searchCards(actor: LibraryActor | null, search: URLSearchParams): ItemCard[] {
  const q = (search.get("q") ?? "").trim()
  const rows = filterByParams(actor, search, catalogueOf(actor))
  const hits: Hit[] = q
    ? rows.map((s) => matchQuery(s, q)).filter((h): h is Hit => h !== null)
    : rows.map((stored) => ({ stored, score: 0, snippet: null }))
  const sort = search.get("sort") ?? (q ? "relevance" : "newest")
  return sortHits(hits, sort).map((hit) => ({
    ...cardFor(actor, hit.stored),
    ...(hit.snippet ? { snippet: hit.snippet.snippet, snippet_page: hit.snippet.page } : {}),
  }))
}

// - - - Reading lists helpers - - -

function listCard(detail: ReadingListDetail): ReadingListCard {
  return {
    id: detail.id,
    title: detail.title,
    description: detail.description,
    scope: detail.scope,
    status: detail.status,
    subject: detail.subject,
    year_of_study: detail.year_of_study,
    academic_year: detail.academic_year,
    term_half: detail.term_half,
    owner: detail.owner,
    entry_count: detail.entry_count,
    essential_count: detail.essential_count,
    essential_done: detail.essential_done,
    updated_at: detail.updated_at,
  }
}

function canWriteLists(actor: LibraryActor): boolean {
  return actor.roles.includes("teacher") || isLibraryStaff(actor)
}

function findList(actor: LibraryActor | null, id: string): StoredList | undefined {
  const list = state.lists.get(id)
  return list && listVisible(actor, list) ? list : undefined
}

function listNotFound(): Response {
  return problem(404, "library/not-found", "Reading list not found")
}

/** The first problem of a list entry, or `null`. */
function entryProblem(actor: LibraryActor, entry: ReadingListItemInput): Response | null {
  if (entry.item_id) {
    const stored = state.items.get(entry.item_id)
    return stored && canSee(actor, stored) ? null : itemNotFound()
  }
  if (!entry.url || !entry.title) return invalid("items", "An entry needs an item or a link with a title")
  return null
}

// - - - Handlers - - -

const normalizeName = (text: string): string =>
  text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\u0400-\u04ff]+/g, "")

export const libraryCatalogueHandlers = [
  http.get(apiUrl("/v1/library/items"), ({ request }) => {
    const actor = actorOf(request)
    return HttpResponse.json(paginate(searchCards(actor, query(request)), request))
  }),

  /** Author names of the books in the store that match `q` (a loose match here; the server also matches across scripts). */
  http.get(apiUrl("/v1/library/authors"), ({ request }) => {
    const q = normalizeName(query(request).get("q") ?? "")
    const names = new Set<string>()
    for (const stored of state.items.values()) {
      for (const name of stored.detail.author_label ? stored.detail.author_label.split(", ") : []) names.add(name)
    }
    return HttpResponse.json([...names].filter((name) => q === "" || normalizeName(name).includes(q)).slice(0, 20))
  }),

  /** Tags of the books in the store, most used first; `q` narrows them. */
  http.get(apiUrl("/v1/library/tags"), ({ request }) => {
    const params = query(request)
    const q = normalizeName(params.get("q") ?? "")
    const limit = Number(params.get("limit") ?? 8)
    const counts = new Map<string, number>()
    for (const stored of state.items.values()) {
      for (const tag of stored.input?.tags ?? []) counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
    const rows = [...counts]
      .filter(([name]) => q === "" || normalizeName(name).includes(q))
      .map(([name, item_count]) => ({ name, item_count }))
      .toSorted((a, b) => b.item_count - a.item_count || a.name.localeCompare(b.name))
    return HttpResponse.json(rows.slice(0, limit))
  }),

  /** Subjects that have visible items; `?all=1` lists every subject (counts may be 0), for pickers. */
  http.get(apiUrl("/v1/library/subjects"), ({ request }) => {
    const counted = subjectCounts(catalogueOf(actorOf(request)).map((s) => s.detail))
    const all = query(request).get("all")
    if (all !== "1" && all !== "true") return HttpResponse.json(counted)
    const rows = Object.values(libSubjects).map((s) => ({
      id: s.id,
      name: s.name,
      item_count: counted.find((c) => c.id === s.id)?.item_count ?? 0,
    }))
    return HttpResponse.json(rows.toSorted((a, b) => a.name.localeCompare(b.name)))
  }),

  http.get(apiUrl("/v1/library/items/:id"), ({ params, request }) => {
    const actor = actorOf(request)
    const stored = visibleItem(actor, param(params, "id"))
    return stored ? HttpResponse.json(detailFor(actor, stored)) : itemNotFound()
  }),

  http.get(apiUrl("/v1/library/items/:id/files/:fid/url"), ({ params, request }) => {
    const actor = actorOf(request)
    const stored = visibleItem(actor, param(params, "id"))
    if (!stored) return itemNotFound()
    if (stored.detail.kind === "external") return notSupported()
    const file = stored.detail.files.find((f) => f.id === param(params, "fid"))
    if (!file) return itemNotFound()
    const inline = query(request).get("inline") === "1"
    const can = libraryCan(actor, stored.detail, stored.ownerId)
    if (inline ? !can.read : !can.download) {
      return problem(403, "common/forbidden", "You are not allowed to open this file", {
        params: { reason: inline ? "not-readable" : "download-not-allowed" },
      })
    }
    const body: ItemFileUrl = {
      url: `${TEST_STORAGE_URL}/library/files/${file.id}?signature=test`,
      expires_at: FILE_LINK_EXPIRES,
      content_type: CONTENT_TYPES[file.format] ?? "application/octet-stream",
      byte_size: file.format === "pdf" ? libPdfBytes.length : file.byte_size,
    }
    return HttpResponse.json(body)
  }),

  /** The mocked object store: every PDF is the tiny fixture PDF (with `Range` support), Markdown is the item text. */
  http.get(`${TEST_STORAGE_URL}/library/files/:fid`, ({ params, request }) => {
    const fileId = param(params, "fid")
    const owner = [...state.items.values()].find((s) => s.detail.files.some((f) => f.id === fileId))
    const format = owner?.detail.files.find((f) => f.id === fileId)?.format ?? "pdf"
    if (format === "md" || format === "txt") {
      return new HttpResponse(owner?.bodyMd ?? "", {
        headers: { "Content-Type": CONTENT_TYPES[format] ?? "text/plain" },
      })
    }
    const bytes = libPdfBytes
    const headers = { "Content-Type": CONTENT_TYPES[format] ?? "application/pdf", "Accept-Ranges": "bytes" }
    const range = /^bytes=(\d+)-(\d*)$/.exec(request.headers.get("Range") ?? "")
    if (!range) return new HttpResponse(bytes, { headers: { ...headers, "Content-Length": String(bytes.length) } })
    const start = Number(range[1])
    const end = Math.min(range[2] ? Number(range[2]) : bytes.length - 1, bytes.length - 1)
    const slice = bytes.slice(start, end + 1)
    return new HttpResponse(slice, {
      status: 206,
      headers: {
        ...headers,
        "Content-Range": `bytes ${start}-${end}/${bytes.length}`,
        "Content-Length": String(slice.length),
      },
    })
  }),

  http.get(apiUrl("/v1/library/items/:id/text"), ({ params, request }) => {
    const actor = signedIn(request)
    if (actor instanceof Response) return actor
    const stored = visibleItem(actor, param(params, "id"))
    if (!stored) return itemNotFound()
    if (stored.detail.kind === "external") return notSupported()
    if (!libraryCan(actor, stored.detail, stored.ownerId).read) return forbidden()
    if (stored.detail.files.every((f) => f.text_status === "no_text")) {
      return problem(409, "library/text-unavailable", "This item has no extracted text")
    }
    const search = query(request)
    const from = Number(search.get("page_from") ?? 1) || 1
    const to = Number(search.get("page_to") ?? Number.MAX_SAFE_INTEGER) || Number.MAX_SAFE_INTEGER
    const pages = stored.text
      .map((text, index) => ({ page: index + 1, text }))
      .filter((p) => p.page >= from && p.page <= to)
    const body: ItemText = { pages }
    return HttpResponse.json(body)
  }),

  http.get(apiUrl("/v1/library/topics"), ({ request }) => {
    const actor = signedIn(request)
    if (actor instanceof Response) return actor
    return HttpResponse.json(topicTree(state.topics, query(request).get("subject_id")))
  }),

  http.get(apiUrl("/v1/library/collections"), ({ request }) => {
    const actor = actorOf(request)
    const visible = catalogueOf(actor)
    const list: Collection[] = state.collections
      .filter((c) => c.published)
      .toSorted((a, b) => a.position - b.position)
      .map((c) => ({
        id: c.id,
        slug: c.slug,
        title: c.title.en,
        description: c.description?.en ?? null,
        cover_url: c.cover_url,
        item_count: visible.filter((s) => s.detail.id && c.item_ids.includes(s.detail.id)).length,
      }))
    return HttpResponse.json(list)
  }),

  http.get(apiUrl("/v1/library/collections/:id"), ({ params, request }) => {
    const actor = actorOf(request)
    const id = param(params, "id")
    const c = state.collections.find((x) => (x.id === id || x.slug === id) && (x.published || isLibraryStaff(actor)))
    if (!c) return problem(404, "library/not-found", "Collection not found")
    const items = catalogueOf(actor).filter((s) => s.detail.id && c.item_ids.includes(s.detail.id))
    const body: CollectionDetail = {
      id: c.id,
      slug: c.slug,
      title: c.title.en,
      description: c.description?.en ?? null,
      cover_url: c.cover_url,
      item_count: items.length,
      items: items.map((s) => cardFor(actor, s)),
    }
    return HttpResponse.json(body)
  }),

  // --- Reading lists ---
  http.get(apiUrl("/v1/library/reading-lists"), ({ request }) => {
    const actor = signedIn(request)
    if (actor instanceof Response) return actor
    const search = query(request)
    const cards = [...state.lists.values()]
      .filter((l) => listVisible(actor, l))
      .map((l) => listDetailFor(actor, l))
      .filter((d) => {
        if (search.get("subject_id") && d.subject?.id !== search.get("subject_id")) return false
        if (search.get("mine") === "true" && d.owner.id !== actor.id) return false
        if (search.get("group_id") && !d.group_ids.includes(search.get("group_id") ?? "")) return false
        if (search.get("status") && d.status !== search.get("status")) return false
        return true
      })
      .map(listCard)
    return HttpResponse.json(cards)
  }),

  http.get(apiUrl("/v1/library/reading-lists/:id"), ({ params, request }) => {
    const actor = signedIn(request)
    if (actor instanceof Response) return actor
    const list = findList(actor, param(params, "id"))
    return list ? HttpResponse.json(listDetailFor(actor, list)) : listNotFound()
  }),

  http.post(apiUrl("/v1/library/reading-lists"), async ({ request }) => {
    const actor = signedIn(request)
    if (actor instanceof Response) return actor
    if (!canWriteLists(actor)) return forbidden()
    const body = await readJson<ReadingListInput>(request)
    if (!body.title?.trim()) return invalid("title", "A title is required")
    const detail: ReadingListDetail = {
      id: newId(),
      title: body.title,
      description: body.description ?? null,
      scope: body.scope ?? "subject",
      status: body.status ?? "draft",
      subject: subjectRef(body.subject_id),
      year_of_study: body.year_of_study ?? null,
      academic_year: body.academic_year ?? null,
      term_half: body.term_half ?? null,
      owner: { id: actor.id, name: actor.name },
      entry_count: 0,
      essential_count: 0,
      essential_done: 0,
      updated_at: stamp(),
      group_ids: body.group_ids ?? [],
      entries: [],
      can_edit: true,
    }
    const list: StoredList = { detail, inputs: [] }
    state.lists.set(detail.id, list)
    return HttpResponse.json(listDetailFor(actor, list), { status: 201 })
  }),

  http.patch(apiUrl("/v1/library/reading-lists/:id"), async ({ params, request }) => {
    const actor = signedIn(request)
    if (actor instanceof Response) return actor
    const list = findList(actor, param(params, "id"))
    if (!list) return listNotFound()
    if (!canEditList(actor, list)) return forbidden()
    const body = await readJson<Partial<ReadingListInput>>(request)
    if (body.title !== undefined && !body.title.trim()) return invalid("title", "A title is required")
    const d = list.detail
    list.detail = {
      ...d,
      title: body.title ?? d.title,
      description: body.description === undefined ? d.description : body.description,
      scope: body.scope ?? d.scope,
      status: body.status ?? d.status,
      subject: body.subject_id === undefined ? d.subject : subjectRef(body.subject_id),
      year_of_study: body.year_of_study === undefined ? d.year_of_study : body.year_of_study,
      academic_year: body.academic_year === undefined ? d.academic_year : body.academic_year,
      term_half: body.term_half === undefined ? d.term_half : body.term_half,
      group_ids: body.group_ids ?? d.group_ids,
      updated_at: stamp(),
    }
    return HttpResponse.json(listDetailFor(actor, list))
  }),

  http.delete(apiUrl("/v1/library/reading-lists/:id"), ({ params, request }) => {
    const actor = signedIn(request)
    if (actor instanceof Response) return actor
    const list = findList(actor, param(params, "id"))
    if (!list) return listNotFound()
    if (!canEditList(actor, list)) return forbidden()
    state.lists.delete(list.detail.id)
    return noContent()
  }),

  /** Replaces the entries: more than 100 is `422 library/list-too-long`; an unknown or hidden item is `404`. */
  http.put(apiUrl("/v1/library/reading-lists/:id/items"), async ({ params, request }) => {
    const actor = signedIn(request)
    if (actor instanceof Response) return actor
    const list = findList(actor, param(params, "id"))
    if (!list) return listNotFound()
    if (!canEditList(actor, list)) return forbidden()
    const body = await readJson<{ items: ReadingListItemInput[] }>(request)
    const items = body.items ?? []
    if (items.length > MAX_LIST_ENTRIES) {
      return problem(422, "library/list-too-long", "A reading list has at most 100 entries", {
        params: { limit: MAX_LIST_ENTRIES, count: items.length },
      })
    }
    for (const entry of items) {
      const failure = entryProblem(actor, entry)
      if (failure) return failure
    }
    list.inputs = items.map((entry) => ({ ...entry }))
    list.detail = { ...list.detail, updated_at: stamp() }
    return HttpResponse.json(listDetailFor(actor, list))
  }),
]
