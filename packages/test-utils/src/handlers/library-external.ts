// Library handlers, part 2: UniLibrary (server-side search, record, pin, taxonomies) and its administration.
// While `state.unilibrary.enabled` is false (the default), every `/library/external/unilibrary/*` route answers
// `404 library/external-disabled`. The admin settings route reads and writes the same flag.

import type {
  Feed,
  FeedInput,
  FieldMapEntry,
  ItemCard,
  PinExternalBody,
  UniLibrarySearchResult,
  UniLibrarySettings,
  UniLibraryStatus,
} from "@ihsp/api"
import { HttpResponse, http } from "msw"
import {
  libExternalCards,
  libExternalMeta,
  libExternalPageSize,
  libExternalSearchable,
  libUniStatus,
  libUniTaxonomy,
  makeItemDetail,
  type LibraryActor,
} from "../fixtures/library"
import {
  actorOf,
  adminOnly,
  cardFor,
  externalDisabled,
  invalid,
  isUzbek,
  newId,
  stamp,
  state,
  textMatches,
  unauthorized,
  type StoredItem,
} from "./library-state"
import { apiUrl, noContent, param, problem, query, readJson } from "./utils"

const RETRY_AFTER_SECONDS = 60

/** Flag, sign-in and breaker checks shared by the UniLibrary routes (taxonomies are cached and ignore the breaker). */
function gate(request: Request, options: { breaker?: boolean } = {}): LibraryActor | Response {
  if (!state.unilibrary.enabled) return externalDisabled()
  const actor = actorOf(request)
  if (!actor) return unauthorized()
  if (options.breaker !== false && state.unilibrary.down) {
    return problem(503, "library/external-unavailable", "UniLibrary is not responding", {
      params: { retry_after: RETRY_AFTER_SECONDS },
    })
  }
  return actor
}

/** A record as a card: `id` and the user's shelf state once the record is pinned. */
function recordCard(actor: LibraryActor, card: ItemCard): ItemCard {
  const pinnedId = state.pinned.get(card.external?.external_id ?? "")
  const stored = pinnedId ? state.items.get(pinnedId) : undefined
  return stored ? cardFor(actor, stored) : { ...card }
}

function matchesLanguage(language: string, card: ItemCard, languageId: number | undefined): boolean {
  if (/^\d+$/.test(language)) return languageId === Number(language)
  return card.language === language || card.language.startsWith(`${language}_`)
}

function searchRecords(search: URLSearchParams): ItemCard[] {
  const q = (search.get("q") ?? "").trim()
  const subjectId = search.get("subject_id")
  const fieldId = search.get("field_id")
  const typeId = search.get("type_id")
  const language = search.get("language")
  const access = search.get("access") ?? "any"
  return libExternalSearchable.filter((card) => {
    const meta = libExternalMeta[card.external?.external_id ?? ""]
    const uzbek = isUzbek(card.language)
    if (q && !textMatches(card.title, q, uzbek) && !textMatches(card.author_label, q, uzbek)) return false
    if (subjectId && !card.subjects.some((s) => s.id === subjectId)) return false
    if (fieldId && meta?.field_id !== Number(fieldId)) return false
    if (typeId && meta?.type_id !== Number(typeId)) return false
    if (language && !matchesLanguage(language, card, meta?.language_id)) return false
    if (access !== "any" && card.external?.access !== access) return false
    return true
  })
}

/** Stores the snapshot of a record so it can go on a shelf or in a list. */
function pinRecord(card: ItemCard): StoredItem {
  const externalId = card.external?.external_id ?? ""
  const id = newId()
  const detail = makeItemDetail({
    ...card,
    id,
    slug: `unilibrary-${externalId}`,
    visibility: "lyceum",
    description: card.description_excerpt,
    external_keywords: [],
    external_isbn: null,
    can: { read: false, download: false, add_to_notebook: false, report: true, edit: false },
  })
  const stored: StoredItem = {
    detail,
    ownerId: null,
    addedAt: stamp(),
    submittedAt: null,
    scan: [],
    text: [],
    bodyMd: null,
    input: null,
    supersedesId: null,
  }
  state.items.set(id, stored)
  state.pinned.set(externalId, id)
  return stored
}

function feedNotFound(): Response {
  return problem(404, "library/not-found", "Feed not found")
}

export const libraryExternalHandlers = [
  http.get(apiUrl("/v1/library/external/unilibrary/search"), ({ request }) => {
    const actor = gate(request)
    if (actor instanceof Response) return actor
    const search = query(request)
    const page = Math.max(Number(search.get("page") ?? 1) || 1, 1)
    const found = searchRecords(search)
    const body: UniLibrarySearchResult = {
      items: found.slice((page - 1) * libExternalPageSize, page * libExternalPageSize).map((c) => recordCard(actor, c)),
      page,
      total: found.length,
      stale: state.unilibrary.stale,
    }
    return HttpResponse.json(body)
  }),

  http.get(apiUrl("/v1/library/external/unilibrary/taxonomies"), ({ request }) => {
    // Switched off: 200 with empty lists, like the API (no 404 in the console).
    if (!state.unilibrary.enabled) {
      return HttpResponse.json({ enabled: false, types: [], fields: [], languages: [], access: [] })
    }
    const actor = gate(request, { breaker: false })
    return actor instanceof Response ? actor : HttpResponse.json(libUniTaxonomy)
  }),

  http.get(apiUrl("/v1/library/external/unilibrary/:externalId"), ({ params, request }) => {
    const actor = gate(request)
    if (actor instanceof Response) return actor
    const card = libExternalCards.find((c) => c.external?.external_id === param(params, "externalId"))
    return card ? HttpResponse.json(recordCard(actor, card)) : problem(404, "library/not-found", "Record not found")
  }),

  /** Idempotent: the first call stores the snapshot (`201`), later calls return the same card (`200`). */
  http.post(apiUrl("/v1/library/external/unilibrary/:externalId/item"), async ({ params, request }) => {
    const actor = gate(request, { breaker: false })
    if (actor instanceof Response) return actor
    const externalId = param(params, "externalId")
    const body = await readJson<PinExternalBody>(request)
    if (![1, 2, 3, 4].includes(Number(body.category))) return invalid("category", "category must be 1 to 4")
    const existing = state.pinned.get(externalId)
    if (existing) {
      const stored = state.items.get(existing)
      if (stored) return HttpResponse.json(cardFor(actor, stored))
    }
    if (state.unilibrary.down) {
      return problem(503, "library/external-unavailable", "UniLibrary is not responding", {
        params: { retry_after: RETRY_AFTER_SECONDS },
      })
    }
    const card = libExternalCards.find((c) => c.external?.external_id === externalId)
    if (!card) return problem(404, "library/not-found", "Record not found")
    return HttpResponse.json(cardFor(actor, pinRecord(card)), { status: 201 })
  }),

  // --- Administration (works while UniLibrary is off: this is where it is turned on) ---
  http.get(apiUrl("/v1/admin/library/unilibrary/settings"), ({ request }) => {
    const actor = adminOnly(request)
    if (actor instanceof Response) return actor
    const body: UniLibrarySettings = {
      enabled: state.unilibrary.enabled,
      anonymous_cards: state.settings.anonymous_cards,
    }
    return HttpResponse.json(body)
  }),

  http.put(apiUrl("/v1/admin/library/unilibrary/settings"), async ({ request }) => {
    const actor = adminOnly(request)
    if (actor instanceof Response) return actor
    const body = await readJson<UniLibrarySettings>(request)
    state.unilibrary.enabled = body.enabled ?? state.unilibrary.enabled
    state.settings = {
      enabled: state.unilibrary.enabled,
      anonymous_cards: body.anonymous_cards ?? state.settings.anonymous_cards,
    }
    return HttpResponse.json({ enabled: state.unilibrary.enabled, anonymous_cards: state.settings.anonymous_cards })
  }),

  http.get(apiUrl("/v1/admin/library/unilibrary/feeds"), ({ request }) => {
    const actor = adminOnly(request)
    return actor instanceof Response ? actor : HttpResponse.json(state.feeds)
  }),

  http.post(apiUrl("/v1/admin/library/unilibrary/feeds"), async ({ request }) => {
    const actor = adminOnly(request)
    if (actor instanceof Response) return actor
    const body = await readJson<FeedInput>(request)
    if (!body.name?.trim()) return invalid("name", "A name is required")
    const feed: Feed = {
      id: newId(),
      name: body.name,
      enabled: false,
      params: body.params ?? { category: 1, field_ids: [], type_ids: [], language_ids: [], access: ["open"] },
      max_items: body.max_items ?? 500,
      estimate: null,
      last_run_at: null,
      last_status: null,
      last_count: null,
    }
    state.feeds.push(feed)
    return HttpResponse.json(feed, { status: 201 })
  }),

  http.patch(apiUrl("/v1/admin/library/unilibrary/feeds/:id"), async ({ params, request }) => {
    const actor = adminOnly(request)
    if (actor instanceof Response) return actor
    const index = state.feeds.findIndex((f) => f.id === param(params, "id"))
    const current = state.feeds[index]
    if (!current) return feedNotFound()
    const body = await readJson<Partial<FeedInput>>(request)
    const next: Feed = {
      ...current,
      name: body.name ?? current.name,
      params: body.params ?? current.params,
      max_items: body.max_items ?? current.max_items,
      // The parameters changed, so the old estimate no longer applies.
      estimate: body.params ? null : current.estimate,
    }
    state.feeds[index] = next
    return HttpResponse.json(next)
  }),

  http.delete(apiUrl("/v1/admin/library/unilibrary/feeds/:id"), ({ params, request }) => {
    const actor = adminOnly(request)
    if (actor instanceof Response) return actor
    const index = state.feeds.findIndex((f) => f.id === param(params, "id"))
    if (index < 0) return feedNotFound()
    state.feeds.splice(index, 1)
    return noContent()
  }),

  /** `dry-run` sets the estimate; `run` records a run; `enable` and `disable` flip the flag. */
  http.post(apiUrl("/v1/admin/library/unilibrary/feeds/:id/:action"), ({ params, request }) => {
    const actor = adminOnly(request)
    if (actor instanceof Response) return actor
    const index = state.feeds.findIndex((f) => f.id === param(params, "id"))
    const current = state.feeds[index]
    if (!current) return feedNotFound()
    const action = param(params, "action")
    let next: Feed
    if (action === "dry-run") {
      next = { ...current, estimate: Math.max(current.params.field_ids.length, 1) * 120 }
    } else if (action === "run") {
      const count = Math.min(current.estimate ?? 50, current.max_items)
      next = { ...current, last_run_at: stamp(), last_status: "ok", last_count: count }
    } else if (action === "enable" || action === "disable") {
      next = { ...current, enabled: action === "enable" }
    } else {
      return problem(404, "common/not-found", "Unknown feed action")
    }
    state.feeds[index] = next
    return HttpResponse.json(next)
  }),

  http.get(apiUrl("/v1/admin/library/unilibrary/field-map"), ({ request }) => {
    const actor = adminOnly(request)
    return actor instanceof Response ? actor : HttpResponse.json(state.fieldMap)
  }),

  http.put(apiUrl("/v1/admin/library/unilibrary/field-map"), async ({ request }) => {
    const actor = adminOnly(request)
    if (actor instanceof Response) return actor
    const body = (await request.json().catch(() => null)) as FieldMapEntry[] | null
    state.fieldMap = Array.isArray(body) ? body : state.fieldMap
    return HttpResponse.json(state.fieldMap)
  }),

  http.get(apiUrl("/v1/admin/library/unilibrary/status"), ({ request }) => {
    const actor = adminOnly(request)
    if (actor instanceof Response) return actor
    const body: UniLibraryStatus = {
      ...libUniStatus,
      breaker: state.unilibrary.down ? "open" : "closed",
      cache: {
        ...libUniStatus.cache,
        stale_served: libUniStatus.cache.stale_served + (state.unilibrary.stale ? 1 : 0),
      },
    }
    return HttpResponse.json(body)
  }),
]
