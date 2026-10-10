// Library handlers, part 5: the librarian area. The queue, moderation (the state machine of § 3.5), report decisions,
// books (draft, rights checklist, publish, takedown, files) and CSV import.
//
// Moderation transitions: approve, request-changes, reject need `pending_review`; hold needs `published`; restore needs
// `held` or `unpublished`; unpublish needs `published` or `held`. A reason is required for everything except approve.
// Publishing a book runs the checklist `rights`, `text_status`, `cover`, `subjects` (`422 library/rights-incomplete`).

import type {
  BookAction,
  BookActionBody,
  BookDraft,
  BookFileBody,
  BookInput,
  BookRow,
  ImportBody,
  ImportResult,
  ItemDetail,
  ItemStatus,
  ManageQueueRow,
  ModerationAction,
  ModerationBody,
  QueueTab,
  ReportResolveBody,
} from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { TEST_STORAGE_URL } from "../fixtures/env"
import {
  libBookInputs,
  libIds,
  makeItemDetail,
  makeItemFile,
  makeQueueRow,
  rightsMissing,
  type LibraryActor,
} from "../fixtures/library"
import { FIXTURE_TODAY } from "../fixtures/world"
import {
  cardFor,
  detailFor,
  findItem,
  invalid,
  isUzbek,
  itemNotFound,
  newId,
  notEditable,
  stamp,
  staffOnly,
  state,
  subjectRef,
  textMatches,
  type StoredItem,
} from "./library-state"
import { apiUrl, noContent, paginate, param, problem, query, readJson } from "./utils"

const QUEUE_TABS: QueueTab[] = ["review", "reports", "held", "rights", "suggestions"]
const MODERATION_ACTIONS: ModerationAction[] = ["approve", "request-changes", "reject", "hold", "restore", "unpublish"]
const BOOK_ACTIONS: BookAction[] = ["publish", "unpublish", "takedown"]
const EXPIRY_WINDOW_DAYS = 60
const DAY_MS = 86_400_000

// - - - Queue - - -

function openReports(itemId: string | null) {
  return state.reports.filter((r) => r.itemId === itemId && !r.resolved)
}

function reportSummary(itemId: string | null): ManageQueueRow["reports"] {
  const counts = new Map<string, number>()
  for (const r of openReports(itemId)) counts.set(r.reason, (counts.get(r.reason) ?? 0) + 1)
  return [...counts].map(([reason, count]) => ({ reason, count }))
}

/** A book's rights basis is missing, or a permission expires within 60 days. */
function rightsNeedAttention(stored: StoredItem): boolean {
  const input = stored.input
  if (!input || stored.detail.kind !== "book" || !["draft", "published", "held"].includes(stored.detail.status))
    return false
  if (
    rightsMissing(
      input.rights ?? "official",
      { ...input.rights_basis },
      { proofFileId: input.rights_proof_file_id, licence: input.licence },
    ).length > 0
  ) {
    return true
  }
  const expires = input.rights === "permission" ? input.rights_basis?.permission_expires_on : null
  if (!expires) return false
  const days = (Date.parse(expires) - Date.parse(FIXTURE_TODAY)) / DAY_MS
  return days <= EXPIRY_WINDOW_DAYS
}

function rowOf(
  actor: LibraryActor,
  stored: StoredItem,
  kind: ManageQueueRow["kind"],
  over: Partial<ManageQueueRow> = {},
) {
  return makeQueueRow(stored.detail, kind, {
    item: cardFor(actor, stored),
    scan: { findings: stored.scan },
    submitted_at: stored.submittedAt ?? stored.addedAt,
    ...over,
  })
}

const oldestFirst = (a: StoredItem, b: StoredItem) =>
  (a.submittedAt ?? a.addedAt).localeCompare(b.submittedAt ?? b.addedAt)

function queueRows(actor: LibraryActor, tab: QueueTab): ManageQueueRow[] {
  const items = [...state.items.values()].filter((s) => s.detail.kind !== "external")
  if (tab === "review") {
    return items
      .filter((s) => s.detail.status === "pending_review" && s.detail.kind === "material")
      .toSorted(oldestFirst)
      .map((s) =>
        rowOf(actor, s, s.detail.material?.uploader_role === "teacher" ? "teacher_material" : "student_material"),
      )
  }
  if (tab === "reports" || tab === "held") {
    const wanted: ItemStatus = tab === "held" ? "held" : "published"
    return items
      .filter((s) => s.detail.status === wanted && (tab === "held" || openReports(s.detail.id).length > 0))
      .toSorted(oldestFirst)
      .map((s) =>
        rowOf(actor, s, "report", {
          reports: reportSummary(s.detail.id),
          report_ids: openReports(s.detail.id).map((r) => r.id),
        }),
      )
  }
  if (tab === "rights") {
    return items
      .filter(rightsNeedAttention)
      .toSorted((a, b) => a.addedAt.localeCompare(b.addedAt))
      .map((s) => rowOf(actor, s, "rights"))
  }
  return state.suggestions.map((s) =>
    makeQueueRow(
      makeItemDetail({
        id: null,
        slug: null,
        kind: "book",
        type: "other",
        title: s.title,
        author_label: "",
        status: "pending_review",
        has_text: false,
      }),
      "suggestion",
      {
        submitted_at: s.createdAt,
        suggestion: { id: s.id, title: s.title, url: s.url, note: s.note, user_name: s.userName },
      },
    ),
  )
}

// - - - Moderation - - -

type Transition = { from: ItemStatus[]; to: ItemStatus }
const TRANSITIONS: Record<ModerationAction, Transition> = {
  approve: { from: ["pending_review"], to: "published" },
  "request-changes": { from: ["pending_review"], to: "changes_requested" },
  reject: { from: ["pending_review"], to: "rejected" },
  hold: { from: ["published"], to: "held" },
  restore: { from: ["held", "unpublished"], to: "published" },
  unpublish: { from: ["published", "held"], to: "unpublished" },
}

function setStatus(stored: StoredItem, status: ItemStatus, reason: string | null, note: string | null): void {
  stored.detail = { ...stored.detail, status, status_reason: reason, status_note: note }
  if (status === "published") for (const r of openReports(stored.detail.id)) r.resolved = true
  const older = status === "published" && stored.supersedesId ? state.items.get(stored.supersedesId) : undefined
  if (older) older.detail = { ...older.detail, status: "unpublished", status_reason: "superseded", status_note: null }
}

function moderate(
  actor: LibraryActor,
  stored: StoredItem,
  action: ModerationAction,
  body: ModerationBody,
): Response | null {
  const reason = body.reason?.trim() ?? ""
  if (action !== "approve" && !reason) return invalid("reason", "A reason is required")
  if (reason.length > 40) return invalid("reason", "A reason code or at most 40 characters")
  if (action === "approve" && stored.ownerId === actor.id && !actor.roles.includes("admin")) {
    return problem(403, "library/own-item", "Another librarian must approve your own upload")
  }
  const transition = TRANSITIONS[action]
  if (!transition.from.includes(stored.detail.status)) return notEditable({ status: stored.detail.status, action })
  setStatus(stored, transition.to, action === "approve" ? null : reason, body.note?.trim() || null)
  return null
}

// - - - Books - - -

const COVERS = `${TEST_STORAGE_URL}/library/covers`

const RIGHTS_TEXT: Record<string, string> = {
  public_domain: "Public domain.",
  open_license: "Openly licensed: share and adapt with attribution.",
  permission: "Hosted with the written permission of the rights holder, for lyceum members only.",
  official: "Official textbook, available to lyceum members only.",
}

function bookSlug(title: string, id: string): string {
  return `${title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")}-${id.slice(-4)}`
}

function validateBook(input: Partial<BookInput>): Response | null {
  if (!input.title?.trim()) return invalid("title", "A title is required")
  if (!input.authors || input.authors.length === 0) return invalid("authors", "At least one author is required")
  return null
}

function bookDetail(id: string, input: BookInput, base: ItemDetail | null): ItemDetail {
  const topics = input.topics.flatMap((t) => {
    const topic = state.topics.find((x) => x.id === t.topic_id)
    return topic
      ? [{ id: topic.id, name: topic.name.en, page_from: t.page_from ?? null, page_to: t.page_to ?? null }]
      : []
  })
  return makeItemDetail({
    ...base,
    id,
    slug: base?.slug ?? bookSlug(input.title, id),
    kind: "book",
    type: input.type,
    title: input.title,
    subtitle: input.subtitle ?? null,
    author_label: input.authors.join(", "),
    language: input.language,
    year_published: input.year_published ?? null,
    publisher: input.publisher ?? null,
    isbn: input.isbn ?? null,
    description: input.description ?? null,
    description_excerpt: input.description ? input.description.slice(0, 140) : null,
    cover_url: input.cover_file_id ? `${COVERS}/${input.cover_file_id}.jpg` : null,
    subjects: input.subjects.map((s) => subjectRef(s.subject_id)).filter((s) => s !== null),
    years_of_study: input.years_of_study,
    topics,
    visibility: input.visibility,
    status: base?.status ?? "draft",
    tag: { source: "book", label: "Library book" },
    book: { rights: input.rights ?? "official", licence: input.licence ?? null, download_allowed: input.download_allowed },
    rights_box: {
      text: RIGHTS_TEXT[input.rights ?? "official"] ?? "",
      attribution: input.rights_basis?.attribution ?? null,
      download_allowed: input.download_allowed,
    },
    files: base?.files ?? [],
    has_text: base?.has_text ?? false,
  })
}

function newBook(input: BookInput): StoredItem {
  const id = newId()
  const stored: StoredItem = {
    detail: bookDetail(id, input, null),
    ownerId: null,
    addedAt: stamp(),
    submittedAt: null,
    scan: [],
    text: [],
    bodyMd: null,
    input,
    supersedesId: null,
  }
  state.items.set(id, stored)
  return stored
}

/** The publish checklist: `text_status`, `cover`, `subjects`. */
function checklistOf(stored: StoredItem): { key: string; ok: boolean }[] {
  const input = stored.input
  const d = stored.detail
  const primary = d.files.find((f) => f.is_primary) ?? d.files[0]
  const inCollection = state.collections.some((c) => !!d.id && c.item_ids.includes(d.id))
  return [
    { key: "text_status", ok: !!primary && (primary.text_status === "ready" || primary.text_status === "no_text") },
    { key: "cover", ok: !!d.cover_url },
    { key: "subjects", ok: (input?.subjects.length ?? 0) > 0 || inCollection },
  ]
}

/** What `params.missing` of `library/rights-incomplete` lists: rights fields, `text_status`, `cover`, `subjects`. */
function missingOf(stored: StoredItem): string[] {
  const missing: string[] = []
  for (const check of checklistOf(stored)) {
    if (!check.ok) missing.push(check.key)
  }
  return missing
}

function findBook(id: string): StoredItem | undefined {
  const stored = findItem(id)
  return stored?.detail.kind === "book" ? stored : undefined
}

function bookRow(actor: LibraryActor, stored: StoredItem): BookRow {
  const primary = stored.detail.files.find((f) => f.is_primary) ?? stored.detail.files[0]
  return {
    item: cardFor(actor, stored),
    status: stored.detail.status,
    visibility: stored.detail.visibility,
    rights: stored.detail.book?.rights ?? "public_domain",
    text_status: primary?.text_status ?? "none",
    updated_at: stored.addedAt,
  }
}

export const libraryManageHandlers = [
  http.get(apiUrl("/v1/manage/library/queue"), ({ request }) => {
    const actor = staffOnly(request)
    if (actor instanceof Response) return actor
    const tab = query(request).get("tab") as QueueTab | null
    if (!tab || !QUEUE_TABS.includes(tab))
      return invalid("tab", "tab must be review, reports, held, rights or suggestions")
    return HttpResponse.json(paginate(queueRows(actor, tab), request))
  }),

  http.post(apiUrl("/v1/manage/library/items/:id/:action"), async ({ params, request }) => {
    const actor = staffOnly(request)
    if (actor instanceof Response) return actor
    const action = param(params, "action") as ModerationAction
    if (!MODERATION_ACTIONS.includes(action)) return problem(404, "common/not-found", "Unknown action")
    const stored = findItem(param(params, "id"))
    if (!stored) return itemNotFound()
    const failure = moderate(actor, stored, action, await readJson<ModerationBody>(request))
    return failure ?? HttpResponse.json(detailFor(actor, stored))
  }),

  /** Resolving a report applies to every open report of the same item: `dismiss` restores a held item. */
  http.post(apiUrl("/v1/manage/library/reports/:id/resolve"), async ({ params, request }) => {
    const actor = staffOnly(request)
    if (actor instanceof Response) return actor
    const report = state.reports.find((r) => r.id === param(params, "id"))
    const stored = report ? findItem(report.itemId) : undefined
    if (!report || !stored) return problem(404, "library/not-found", "Report not found")
    const { action } = await readJson<ReportResolveBody>(request)
    if (action === "dismiss") {
      for (const r of openReports(report.itemId)) r.resolved = true
      if (stored.detail.status === "held") setStatus(stored, "published", null, null)
    } else if (action === "hold") {
      if (stored.detail.status === "published") setStatus(stored, "held", "reported", null)
    } else if (action === "unpublish" || action === "unpublish_and_warn") {
      for (const r of openReports(report.itemId)) r.resolved = true
      setStatus(stored, "unpublished", "reported", null)
      if (action === "unpublish_and_warn" && stored.ownerId) {
        state.sanctions.push({
          id: newId(),
          user_id: stored.ownerId,
          kind: "warning",
          until: null,
          reason: "An upheld report",
          item_id: stored.detail.id,
          created_at: stamp(),
        })
      }
    } else {
      return invalid("action", "Unknown action")
    }
    return noContent()
  }),

  // --- Books ---
  http.get(apiUrl("/v1/manage/library/books"), ({ request }) => {
    const actor = staffOnly(request)
    if (actor instanceof Response) return actor
    const search = query(request)
    const q = search.get("q") ?? ""
    const rows = [...state.items.values()]
      .filter((s) => s.detail.kind === "book")
      .filter((s) => !search.get("status") || s.detail.status === search.get("status"))
      .filter((s) => !q || textMatches(`${s.detail.title} ${s.detail.author_label}`, q, isUzbek(s.detail.language)))
      .toSorted((a, b) => b.addedAt.localeCompare(a.addedAt))
      .map((s) => bookRow(actor, s))
    return HttpResponse.json(paginate(rows, request))
  }),

  http.post(apiUrl("/v1/manage/library/books/:id/files"), async ({ params, request }) => {
    const actor = staffOnly(request)
    if (actor instanceof Response) return actor
    const stored = findBook(param(params, "id"))
    if (!stored) return itemNotFound()
    const body = await readJson<BookFileBody>(request)
    if (!body.file_id || !body.format) return invalid("file_id", "file_id and format are required")
    const file = makeItemFile({
      id: body.file_id,
      format: body.format,
      is_primary: body.is_primary ?? stored.detail.files.length === 0,
      pages: body.format === "pdf" ? 48 : null,
      byte_size: 500_000,
    })
    const others = stored.detail.files.map((f) => (file.is_primary ? { ...f, is_primary: false } : f))
    stored.detail = { ...stored.detail, files: [...others, file], has_text: true }
    return HttpResponse.json(file, { status: 201 })
  }),

  http.get(apiUrl("/v1/manage/library/books/:id"), ({ params, request }) => {
    const actor = staffOnly(request)
    if (actor instanceof Response) return actor
    const stored = findBook(param(params, "id"))
    if (!stored?.input) return itemNotFound()
    const body: BookDraft = { item: detailFor(actor, stored), input: stored.input, checklist: checklistOf(stored) }
    return HttpResponse.json(body)
  }),

  http.post(apiUrl("/v1/manage/library/books"), async ({ request }) => {
    const actor = staffOnly(request)
    if (actor instanceof Response) return actor
    const input = (await readJson<BookInput>(request)) as BookInput
    const failure = validateBook(input)
    if (failure) return failure
    const stored = newBook({
      ...input,
      translators: input.translators ?? [],
      topics: input.topics ?? [],
      subjects: input.subjects ?? [],
      rights_basis: input.rights_basis ?? {},
      years_of_study: input.years_of_study ?? [],
    })
    return HttpResponse.json(detailFor(actor, stored), { status: 201 })
  }),

  http.patch(apiUrl("/v1/manage/library/books/:id"), async ({ params, request }) => {
    const actor = staffOnly(request)
    if (actor instanceof Response) return actor
    const stored = findBook(param(params, "id"))
    if (!stored?.input) return itemNotFound()
    const merged: BookInput = { ...stored.input, ...(await readJson<BookInput>(request)) }
    const failure = validateBook(merged)
    if (failure) return failure
    stored.input = merged
    stored.detail = bookDetail(stored.detail.id ?? "", merged, stored.detail)
    return HttpResponse.json(detailFor(actor, stored))
  }),

  http.post(apiUrl("/v1/manage/library/books/:id/:action"), async ({ params, request }) => {
    const actor = staffOnly(request)
    if (actor instanceof Response) return actor
    const action = param(params, "action") as BookAction
    if (!BOOK_ACTIONS.includes(action)) return problem(404, "common/not-found", "Unknown action")
    const stored = findBook(param(params, "id"))
    if (!stored?.input) return itemNotFound()
    const reason = (await readJson<BookActionBody>(request)).reason?.trim() ?? ""
    const status = stored.detail.status
    if (action === "publish") {
      if (status === "published") return notEditable({ status, action })
      const missing = missingOf(stored)
      if (missing.length > 0) {
        return problem(422, "library/rights-incomplete", "The book cannot be published yet", { params: { missing } })
      }
      setStatus(stored, "published", null, null)
    } else if (action === "unpublish") {
      if (status !== "published") return notEditable({ status, action })
      setStatus(stored, "unpublished", reason || null, null)
    } else {
      if (!reason) return invalid("reason", "A reason is required")
      if (status === "unpublished") return notEditable({ status, action })
      setStatus(stored, "unpublished", reason, null)
    }
    return HttpResponse.json(detailFor(actor, stored))
  }),

  /** Good rows become draft books, bad rows are listed: this mock always imports two books and reports row 4. */
  http.post(apiUrl("/v1/manage/library/import"), async ({ request }) => {
    const actor = staffOnly(request)
    if (actor instanceof Response) return actor
    const body = await readJson<ImportBody>(request)
    if (!body.csv_file_id) return invalid("csv_file_id", "Upload the CSV first")
    const template = libBookInputs[libIds.bookDraft] ?? Object.values(libBookInputs)[0]
    if (template) {
      for (const n of [1, 2]) newBook({ ...template, title: `Imported book ${n}`, authors: ["Import Author"] })
    }
    const result: ImportResult = { created: 2, errors: [{ row: 4, message: "Missing rights class" }] }
    return HttpResponse.json(result)
  }),
]
