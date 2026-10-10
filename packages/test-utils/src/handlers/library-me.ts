// Library handlers, part 3: the reader's own data (shelf, progress, annotations, uploads list), reports and suggestions.

import type {
  Annotation,
  AnnotationInput,
  AnnotationPatchBody,
  AnnotationsSyncBody,
  LibraryReportBody,
  MeLibrary,
  ProgressBody,
  ShelfEntry,
  ShelfState,
  SuggestionBody,
  UploadRow,
} from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { uploaderRoleOf, type LibraryActor } from "../fixtures/library"
import {
  cardFor,
  findItem,
  forbidden,
  invalid,
  itemNotFound,
  newId,
  notSupported,
  signedIn,
  stamp,
  state,
  userState,
  canSee,
  visibleItem,
  type StoredItem,
  type StoredReport,
} from "./library-state"
import { apiUrl, noContent, paginate, param, problem, query, readJson } from "./utils"

const SHELF_STATES: ShelfState[] = ["want", "reading", "done"]
const ANNOTATION_KINDS = ["highlight", "note", "bookmark"]
const ANNOTATION_COLORS = ["yellow", "green", "blue", "pink"]
const REPORT_REASONS = ["wrong_content", "copyright", "inappropriate", "personal_data", "exam_leak", "spam", "other"]
/** Reasons that count towards the automatic hold (§ 3.5); a report from staff holds at once. */
const HOLD_REASONS = ["copyright", "personal_data", "inappropriate", "exam_leak"]
const REPORTS_PER_DAY = 10
const MAX_SYNC_CHANGES = 200

// - - - Shelf - - -

function shelfEntry(actor: LibraryActor, stored: StoredItem): ShelfEntry | null {
  const row = stored.detail.id ? userState(actor.id).shelf.get(stored.detail.id) : undefined
  if (!row) return null
  const d = stored.detail
  return {
    item: cardFor(actor, stored),
    state: row.state,
    finished_at: row.finishedAt,
    updated_at: row.updatedAt,
    removed: d.status !== "published" || d.visibility === "hidden",
  }
}

/** Shelf rows, newest first. Taken-down items stay as `removed` rows; UniLibrary records vanish while it is off. */
function shelfEntries(actor: LibraryActor): ShelfEntry[] {
  const rows = [...userState(actor.id).shelf.values()].toSorted((a, b) => b.seq - a.seq)
  const entries: ShelfEntry[] = []
  for (const row of rows) {
    const stored = state.items.get(row.itemId)
    if (!stored || (stored.detail.kind === "external" && !state.unilibrary.enabled)) continue
    const entry = shelfEntry(actor, stored)
    if (entry) entries.push(entry)
  }
  return entries
}

function meLibrary(actor: LibraryActor): MeLibrary {
  const user = userState(actor.id)
  const counts: Record<ShelfState, number> = { want: 0, reading: 0, done: 0 }
  for (const entry of shelfEntries(actor)) if (!entry.removed) counts[entry.state] += 1
  const reading = [...user.progress.values()]
    .filter((p) => p.percent < 100)
    .toSorted((a, b) => b.client_ts.localeCompare(a.client_ts))
    .map((p) => state.items.get(p.itemId))
    .filter((s): s is StoredItem => !!s && s.detail.status === "published" && canSee(actor, s))
    .slice(0, 6)
    .map((s) => cardFor(actor, s))
  return { continue: reading, shelf_counts: counts, offline: { max_items: 5, max_bytes: 400 * 1024 * 1024 } }
}

// - - - Annotations - - -

/** Creates or updates (by `client_id`) an annotation of `actor`; the failure is a response. */
function upsertAnnotation(actor: LibraryActor, input: AnnotationInput, mode: "create" | "sync"): Annotation | Response {
  if (!input.client_id) return invalid("client_id", "client_id is required")
  if (!ANNOTATION_KINDS.includes(input.kind)) return invalid("kind", "Unknown annotation kind")
  if (!ANNOTATION_COLORS.includes(input.color)) return invalid("color", "Unknown colour")
  const stored = findItem(input.item_id ?? "")
  if (!stored || !canSee(actor, stored)) return itemNotFound()
  if (stored.detail.kind === "external") return notSupported()
  if (!stored.detail.files.some((f) => f.id === input.file_id))
    return invalid("file_id", "The file is not part of the item")
  const user = userState(actor.id)
  const existing = user.annotations.find((a) => a.client_id === input.client_id)
  if (existing) {
    // Idempotent by `client_id`: a repeated create changes nothing, an offline edit (sync) updates the fields.
    if (mode === "create") return existing
    Object.assign(existing, {
      kind: input.kind,
      locator: input.locator,
      quote: input.quote ?? null,
      note: input.note ?? null,
      color: input.color,
      updated_at: stamp(),
    })
    return existing
  }
  const created: Annotation = {
    id: newId(),
    item_id: input.item_id,
    file_id: input.file_id,
    kind: input.kind,
    locator: input.locator,
    quote: input.quote ?? null,
    note: input.note ?? null,
    color: input.color,
    client_id: input.client_id,
    updated_at: stamp(),
  }
  user.annotations.push(created)
  return created
}

function annotationMarkdown(actor: LibraryActor, itemId: string | null): string {
  const lines: string[] = []
  const groups = new Map<string, Annotation[]>()
  for (const a of userState(actor.id).annotations) {
    if (itemId && a.item_id !== itemId) continue
    groups.set(a.item_id, [...(groups.get(a.item_id) ?? []), a])
  }
  for (const [id, list] of groups) {
    lines.push(`# ${state.items.get(id)?.detail.title ?? id}`, "")
    for (const a of list) {
      const where = "page" in a.locator ? `p. ${a.locator.page}` : `${Math.round(a.locator.progress * 100)}%`
      lines.push(`- **${a.kind}** (${a.color}, ${where})`)
      if (a.quote) lines.push(`  > ${a.quote}`)
      if (a.note) lines.push(`  ${a.note}`)
    }
    lines.push("")
  }
  return lines.join("\n")
}

// - - - Uploads and reports - - -

function uploadRows(actor: LibraryActor): UploadRow[] {
  const mine = [...state.items.values()].filter((s) => s.ownerId === actor.id && s.detail.kind === "material")
  const waiting = mine
    .filter((s) => s.detail.status === "pending_review")
    .toSorted((a, b) => (a.submittedAt ?? "").localeCompare(b.submittedAt ?? ""))
  return mine
    .toSorted((a, b) => b.addedAt.localeCompare(a.addedAt))
    .map((s) => ({
      item: cardFor(actor, s),
      status: s.detail.status,
      reason: s.detail.status_reason,
      review_message: s.detail.status_note,
      queue_position: s.detail.status === "pending_review" ? waiting.indexOf(s) + 1 : null,
    }))
}

function holdIfNeeded(stored: StoredItem, reporter: LibraryActor): void {
  if (stored.detail.status !== "published" || stored.detail.kind === "external") return
  const staff = reporter.roles.some((r) => r === "teacher" || r === "librarian" || r === "admin")
  const open = state.reports.filter(
    (r) => r.itemId === stored.detail.id && !r.resolved && HOLD_REASONS.includes(r.reason),
  )
  if (staff || new Set(open.map((r) => r.userId)).size >= 2) {
    stored.detail = { ...stored.detail, status: "held", status_reason: "reported", status_note: null }
  }
}

export const libraryMeHandlers = [
  http.get(apiUrl("/v1/me/library"), ({ request }) => {
    const actor = signedIn(request)
    return actor instanceof Response ? actor : HttpResponse.json(meLibrary(actor))
  }),

  // --- Shelf ---
  http.get(apiUrl("/v1/me/library/shelf"), ({ request }) => {
    const actor = signedIn(request)
    if (actor instanceof Response) return actor
    const wanted = query(request).get("state")
    return HttpResponse.json(
      paginate(
        shelfEntries(actor).filter((e) => !wanted || e.state === wanted),
        request,
      ),
    )
  }),

  http.put(apiUrl("/v1/me/library/shelf/:itemId"), async ({ params, request }) => {
    const actor = signedIn(request)
    if (actor instanceof Response) return actor
    const stored = visibleItem(actor, param(params, "itemId"))
    if (!stored?.detail.id || stored.detail.status !== "published") return itemNotFound()
    const body = await readJson<{ state: ShelfState }>(request)
    if (!body.state || !SHELF_STATES.includes(body.state))
      return invalid("state", "state must be want, reading or done")
    const now = stamp()
    state.seq += 1
    userState(actor.id).shelf.set(stored.detail.id, {
      itemId: stored.detail.id,
      state: body.state,
      finishedAt: body.state === "done" ? now : null,
      updatedAt: now,
      seq: state.seq,
    })
    const entry = shelfEntry(actor, stored)
    return entry ? HttpResponse.json(entry) : itemNotFound()
  }),

  http.delete(apiUrl("/v1/me/library/shelf/:itemId"), ({ params, request }) => {
    const actor = signedIn(request)
    if (actor instanceof Response) return actor
    userState(actor.id).shelf.delete(param(params, "itemId"))
    return noContent()
  }),

  // --- Progress ---
  http.put(apiUrl("/v1/me/library/progress/:itemId"), async ({ params, request }) => {
    const actor = signedIn(request)
    if (actor instanceof Response) return actor
    const stored = visibleItem(actor, param(params, "itemId"))
    if (!stored?.detail.id) return itemNotFound()
    if (stored.detail.kind === "external") return notSupported()
    const itemId = stored.detail.id
    const body = await readJson<ProgressBody>(request)
    const fileId = body.file_id ?? ""
    if (!stored.detail.files.some((f) => f.id === fileId)) return invalid("file_id", "The file is not part of the item")
    if (typeof body.percent !== "number" || !body.locator) return invalid("percent", "percent and locator are required")
    const progress = userState(actor.id).progress
    const previous = progress.get(itemId)
    const clientTs = body.client_ts ?? stamp()
    // Last write wins by `client_ts`: an older write is accepted and ignored.
    if (!previous || previous.client_ts <= clientTs) {
      progress.set(itemId, {
        file_id: fileId,
        locator: body.locator,
        seconds_read: body.seconds_read,
        client_ts: clientTs,
        percent: Math.min(Math.max(body.percent, 0), 100),
        itemId,
        updatedAt: stamp(),
      })
    }
    return noContent()
  }),

  // --- Annotations ---
  http.get(apiUrl("/v1/me/library/annotations/export"), ({ request }) => {
    const actor = signedIn(request)
    if (actor instanceof Response) return actor
    const markdown = annotationMarkdown(actor, query(request).get("item_id"))
    return new HttpResponse(markdown, { headers: { "Content-Type": "text/markdown; charset=utf-8" } })
  }),

  http.get(apiUrl("/v1/me/library/annotations"), ({ request }) => {
    const actor = signedIn(request)
    if (actor instanceof Response) return actor
    const search = query(request)
    const needle = (search.get("q") ?? "").toLowerCase()
    const rows = userState(actor.id)
      .annotations.filter((a) => {
        if (search.get("item_id") && a.item_id !== search.get("item_id")) return false
        if (search.get("kind") && a.kind !== search.get("kind")) return false
        if (search.get("color") && a.color !== search.get("color")) return false
        return !needle || `${a.quote ?? ""} ${a.note ?? ""}`.toLowerCase().includes(needle)
      })
      .toSorted((a, b) => b.updated_at.localeCompare(a.updated_at))
    return HttpResponse.json(paginate(rows, request))
  }),

  http.post(apiUrl("/v1/me/library/annotations/sync"), async ({ request }) => {
    const actor = signedIn(request)
    if (actor instanceof Response) return actor
    const body = await readJson<AnnotationsSyncBody>(request)
    const upserts = body.upserts ?? []
    const deletes = body.deletes ?? []
    if (upserts.length + deletes.length > MAX_SYNC_CHANGES) {
      return invalid("upserts", "At most 200 changes per request")
    }
    const items: Annotation[] = []
    for (const input of upserts) {
      const result = upsertAnnotation(actor, input, "sync")
      if (result instanceof Response) return result
      items.push(result)
    }
    const user = userState(actor.id)
    // A device that deleted an annotation it never synced only knows the `client_id`.
    user.annotations = user.annotations.filter((a) => !deletes.includes(a.id) && !deletes.includes(a.client_id))
    return HttpResponse.json({ items: items.filter((a) => user.annotations.some((x) => x.id === a.id)) })
  }),

  http.post(apiUrl("/v1/me/library/annotations"), async ({ request }) => {
    const actor = signedIn(request)
    if (actor instanceof Response) return actor
    const result = upsertAnnotation(actor, (await readJson<AnnotationInput>(request)) as AnnotationInput, "create")
    return result instanceof Response ? result : HttpResponse.json(result, { status: 201 })
  }),

  http.patch(apiUrl("/v1/me/library/annotations/:id"), async ({ params, request }) => {
    const actor = signedIn(request)
    if (actor instanceof Response) return actor
    const user = userState(actor.id)
    const index = user.annotations.findIndex((a) => a.id === param(params, "id"))
    const current = user.annotations[index]
    if (!current) return problem(404, "library/not-found", "Annotation not found")
    const body = await readJson<AnnotationPatchBody>(request)
    if (body.color !== undefined && !ANNOTATION_COLORS.includes(body.color)) return invalid("color", "Unknown colour")
    const next: Annotation = {
      ...current,
      note: body.note === undefined ? current.note : body.note,
      color: body.color ?? current.color,
      updated_at: stamp(),
    }
    user.annotations[index] = next
    return HttpResponse.json(next)
  }),

  http.delete(apiUrl("/v1/me/library/annotations/:id"), ({ params, request }) => {
    const actor = signedIn(request)
    if (actor instanceof Response) return actor
    const user = userState(actor.id)
    const before = user.annotations.length
    user.annotations = user.annotations.filter((a) => a.id !== param(params, "id"))
    return user.annotations.length === before ? problem(404, "library/not-found", "Annotation not found") : noContent()
  }),

  // --- My uploads ---
  http.get(apiUrl("/v1/me/library/uploads"), ({ request }) => {
    const actor = signedIn(request)
    if (actor instanceof Response) return actor
    const wanted = query(request).get("status")
    return HttpResponse.json(
      paginate(
        uploadRows(actor).filter((r) => !wanted || r.status === wanted),
        request,
      ),
    )
  }),

  // --- Suggestions and reports ---
  http.post(apiUrl("/v1/library/suggestions"), async ({ request }) => {
    const actor = signedIn(request)
    if (actor instanceof Response) return actor
    const body = await readJson<SuggestionBody>(request)
    if (!body.title?.trim()) return invalid("title", "A title is required")
    state.suggestions.push({
      id: newId(),
      userId: actor.id,
      userName: `${actor.name}${actor.cohort ? `, ${actor.cohort}` : ""}`,
      title: body.title,
      url: body.url ?? null,
      note: body.note ?? null,
      book: body.book ?? null,
      createdAt: stamp(),
    })
    return new HttpResponse(null, { status: 201 })
  }),

  /** Two `exam_leak` (or `copyright`, `personal_data`, `inappropriate`) reports from different users hold a published item; one from staff holds it at once. */
  http.post(apiUrl("/v1/library/items/:id/report"), async ({ params, request }) => {
    const actor = signedIn(request)
    if (actor instanceof Response) return actor
    const stored = visibleItem(actor, param(params, "id"))
    if (!stored?.detail.id) return itemNotFound()
    if (stored.ownerId === actor.id) return forbidden()
    const itemId = stored.detail.id
    const body = await readJson<LibraryReportBody>(request)
    const reason = body.reason ?? ""
    if (!REPORT_REASONS.includes(reason)) return invalid("reason", "Unknown reason")
    if ((body.text ?? "").length > 500) return invalid("text", "At most 500 characters")
    const user = userState(actor.id)
    if (user.reportsToday >= REPORTS_PER_DAY) {
      return problem(429, "library/rate-limited", "Too many reports today", {
        params: { action: "report", limit: REPORTS_PER_DAY, resets_at: "2026-10-08T00:00:00Z" },
      })
    }
    const duplicate = state.reports.some(
      (r) => r.itemId === itemId && r.userId === actor.id && r.reason === reason && !r.resolved,
    )
    if (!duplicate) {
      user.reportsToday += 1
      const report: StoredReport = {
        id: newId(),
        itemId,
        userId: actor.id,
        reporterRole: uploaderRoleOf(actor),
        reason,
        text: body.text ?? null,
        resolved: false,
      }
      state.reports.push(report)
      holdIfNeeded(stored, actor)
    }
    return noContent()
  }),
]
