// In-memory state of the mocked library backend and the helpers every library handler file shares: the acting user,
// visibility rules, card and detail builders, text matching. See the header of `handlers/library.ts` for the controls.

import type {
  Annotation,
  BookInput,
  Feed,
  FieldMapEntry,
  ItemCard,
  ItemDetail,
  ManageCollection,
  ManageSubject,
  ManageTopic,
  SuggestedBook,
  ProgressBody,
  ReadingListDetail,
  ReadingListEntry,
  ReadingListItemInput,
  Sanction,
  ShelfState,
  UniLibrarySettings,
} from "@ihsp/api"
import {
  isLibraryStaff,
  libActors,
  libAnnotations,
  libDetails,
  libExternalPinnedDetail,
  libFeeds,
  libFieldMap,
  libIds,
  libItemMeta,
  libItemText,
  libBookInputs,
  libManageCollections,
  libManageTopics,
  libProgress,
  libQueue,
  libReadingLists,
  libSanctions,
  libShelfEntries,
  libSubjects,
  libUniSettings,
  libraryCan,
  pickCard,
  type LibraryActor,
} from "../fixtures/library"
import { FIXTURE_NOW, ids } from "../fixtures/world"
import { problem } from "./utils"

// - - - Types - - -

export type StoredItem = {
  detail: ItemDetail
  /** Uploader of a material; `null` for books and UniLibrary records. */
  ownerId: string | null
  addedAt: string
  submittedAt: string | null
  scan: string[]
  /** Extracted text, page 1 first. */
  text: string[]
  /** Set by `PATCH .../materials/{id}` with `body_md`; a material without a file reads from it. */
  bodyMd: string | null
  /** The editor's data of a book. */
  input: BookInput | null
  /** The material this one is a new version of. */
  supersedesId: string | null
}

export type StoredReport = {
  id: string
  itemId: string
  userId: string
  reporterRole: "student" | "teacher" | "librarian" | "admin"
  reason: string
  text: string | null
  resolved: boolean
}
export type StoredSuggestion = {
  id: string
  userId: string
  userName: string
  title: string
  url: string | null
  note: string | null
  book: SuggestedBook | null
  createdAt: string
  fileId?: string | null
  status?: "new" | "accepted" | "declined"
  reason?: string | null
  itemId?: string | null
  decidedAt?: string | null
}
export type ShelfRow = { itemId: string; state: ShelfState; finishedAt: string | null; updatedAt: string; seq: number }
export type ProgressRow = ProgressBody & { itemId: string; updatedAt: string }
export type UserState = {
  shelf: Map<string, ShelfRow>
  progress: Map<string, ProgressRow>
  annotations: Annotation[]
  reportsToday: number
}
export type StoredList = { detail: ReadingListDetail; inputs: ReadingListItemInput[] }
export type UniLibraryControls = { enabled: boolean; stale: boolean; down: boolean }
export type ActorControl =
  | { kind: "default" }
  | { kind: "actor"; actor: LibraryActor }
  | { kind: "anonymous" }
  | { kind: "token" }

export type LibraryState = {
  items: Map<string, StoredItem>
  users: Map<string, UserState>
  lists: Map<string, StoredList>
  topics: ManageTopic[]
  subjects: ManageSubject[]
  collections: ManageCollection[]
  reports: StoredReport[]
  suggestions: StoredSuggestion[]
  sanctions: Sanction[]
  feeds: Feed[]
  fieldMap: FieldMapEntry[]
  settings: UniLibrarySettings
  unilibrary: UniLibraryControls
  /** External id to the id of the stored snapshot. */
  pinned: Map<string, string>
  control: ActorControl
  clock: number
  seq: number
}

// - - - State - - -

function storedItem(detail: ItemDetail): StoredItem {
  const id = detail.id ?? ""
  const meta = libItemMeta[id]
  const text = libItemText[id] ?? []
  return {
    detail: structuredClone(detail),
    ownerId: meta?.ownerId ?? null,
    addedAt: meta?.addedAt ?? FIXTURE_NOW,
    submittedAt: meta?.submittedAt ?? null,
    scan: [...(meta?.scan ?? [])],
    text: [...text],
    bodyMd: detail.files.some((f) => f.format === "md") ? text.join("\n\n") : null,
    input: libBookInputs[id] ? structuredClone(libBookInputs[id]) : null,
    supersedesId: null,
  }
}

function seededUser(): UserState {
  const shelf = new Map<string, ShelfRow>()
  libShelfEntries.forEach((entry, index) => {
    const id = entry.item.id ?? ""
    shelf.set(id, {
      itemId: id,
      state: entry.state,
      finishedAt: entry.finished_at,
      updatedAt: entry.updated_at,
      seq: libShelfEntries.length - index,
    })
  })
  const progress = new Map<string, ProgressRow>()
  for (const row of libProgress) {
    progress.set(row.item_id, { ...row, itemId: row.item_id, updatedAt: row.client_ts })
  }
  return { shelf, progress, annotations: structuredClone(libAnnotations), reportsToday: 0 }
}

function seedReport(id: string, itemId: string, userId: string, reason: string): StoredReport {
  return { id, itemId, userId, reporterRole: "student", reason, text: null, resolved: false }
}

function freshState(): LibraryState {
  const items = new Map<string, StoredItem>()
  for (const detail of [...Object.values(libDetails), libExternalPinnedDetail]) {
    if (detail.id) items.set(detail.id, storedItem(detail))
  }
  const suggestion = libQueue.suggestions[0]?.suggestion
  return {
    items,
    users: new Map([[libActors.student.id, seededUser()]]),
    lists: new Map(libReadingLists.map((detail) => [detail.id, listFromDetail(detail)])),
    topics: structuredClone(libManageTopics),
    subjects: Object.values(libSubjects).map((subject, position) => ({
      id: subject.id,
      parent_id: null,
      name: { uz: subject.name, ru: subject.name, en: subject.name },
      slug: subject.name.toLowerCase(),
      code: null,
      position,
      archived: false,
    })),
    collections: structuredClone(libManageCollections),
    reports: [
      seedReport(libIds.reportWrongContent, libIds.matPublished, ids.student2, "wrong_content"),
      seedReport(libIds.reportHeldA, libIds.matHeld, ids.student2, "copyright"),
      seedReport(libIds.reportHeldB, libIds.matHeld, ids.student3, "copyright"),
    ],
    suggestions: suggestion
      ? [
          {
            id: suggestion.id,
            userId: ids.student2,
            userName: suggestion.user_name,
            title: suggestion.title,
            url: suggestion.url,
            note: suggestion.note,
            book: null,
            createdAt: "2026-10-05T10:00:00Z",
          },
        ]
      : [],
    sanctions: structuredClone(libSanctions),
    feeds: structuredClone(libFeeds),
    fieldMap: structuredClone(libFieldMap),
    settings: { ...libUniSettings },
    unilibrary: { enabled: false, stale: false, down: false },
    pinned: new Map([["355186", libIds.extPinned]]),
    control: { kind: "default" },
    clock: 0,
    seq: 100,
  }
}

function listFromDetail(detail: ReadingListDetail): StoredList {
  const inputs: ReadingListItemInput[] = detail.entries.map((entry) => ({
    item_id: entry.item?.id ?? null,
    url: entry.url,
    title: entry.title,
    importance: entry.importance,
    page_from: entry.page_from,
    page_to: entry.page_to,
    week_label: entry.week_label,
    due_on: entry.due_on,
    topic_id: entry.topic_id,
    note: entry.note,
  }))
  return { detail: structuredClone({ ...detail, entries: [] }), inputs }
}

export let state: LibraryState = freshState()

/** Resets the library backend to the fixtures (shelf, uploads, reports, lists, the actor and the UniLibrary controls). */
export function resetLibraryState(): void {
  state = freshState()
}

/** The next timestamp: one second after the previous one, counted from `FIXTURE_NOW`, so ordering is deterministic. */
export function stamp(): string {
  state.clock += 1
  return new Date(Date.parse(FIXTURE_NOW) + state.clock * 1000).toISOString().replace(".000Z", "Z")
}

export function userState(actorId: string): UserState {
  let user = state.users.get(actorId)
  if (!user) {
    user = { shelf: new Map(), progress: new Map(), annotations: [], reportsToday: 0 }
    state.users.set(actorId, user)
  }
  return user
}

// - - - The acting user - - -

function actorFromToken(authorization: string): LibraryActor {
  const token = authorization.toLowerCase()
  if (token.includes("admin")) return libActors.admin
  if (token.includes("librarian2")) return libActors.librarian2
  if (token.includes("librarian")) return libActors.librarian
  if (token.includes("teacher")) return libActors.teacher
  return libActors.student
}

/**
 * The caller of a request, `null` for an anonymous visitor. By default every request is the student; a bearer token
 * containing `admin`, `librarian`, `librarian2` or `teacher` acts as that user. `setLibraryActor` overrides this.
 */
export function actorOf(request: Request): LibraryActor | null {
  const control = state.control
  if (control.kind === "actor") return control.actor
  if (control.kind === "anonymous") return null
  const authorization = request.headers.get("Authorization")
  if (control.kind === "token" && !authorization) return null
  return authorization ? actorFromToken(authorization) : libActors.student
}

// - - - Problems and gates - - -

export const unauthorized = () => problem(401, "auth/unauthorized", "Authentication required")
export const forbidden = () => problem(403, "common/forbidden", "You are not allowed to do this")
export const itemNotFound = () => problem(404, "library/not-found", "Item not found")
export const notSupported = () =>
  problem(409, "library/not-supported", "This action is not available for UniLibrary records")
export const notEditable = (params: Record<string, unknown> = {}) =>
  problem(409, "library/not-editable", "The item cannot be changed in its current state", { params })
export function invalid(field: string, message: string): Response {
  return problem(422, "common/request-validation", message, { errors: [{ field, message }] })
}
export const externalDisabled = () => problem(404, "library/external-disabled", "UniLibrary is not enabled")

/** The signed-in caller, or the `401` response. */
export function signedIn(request: Request): LibraryActor | Response {
  return actorOf(request) ?? unauthorized()
}
/** A librarian or administrator, or the `401` / `403` response. */
export function staffOnly(request: Request): LibraryActor | Response {
  const actor = actorOf(request)
  if (!actor) return unauthorized()
  return isLibraryStaff(actor) ? actor : forbidden()
}
/** An administrator, or the `401` / `403` response. */
export function adminOnly(request: Request): LibraryActor | Response {
  const actor = actorOf(request)
  if (!actor) return unauthorized()
  return actor.roles.includes("admin") ? actor : forbidden()
}

// - - - Items and visibility - - -

export function findItem(idOrSlug: string): StoredItem | undefined {
  const direct = state.items.get(idOrSlug)
  if (direct) return direct
  for (const stored of state.items.values()) if (stored.detail.slug === idOrSlug) return stored
  return undefined
}

/**
 * Whether the caller may see the item. Anonymous visitors see published `public` items only. Signed-in users see
 * published `public` and `lyceum` items and their own uploads; librarians see everything. UniLibrary records exist only
 * while UniLibrary is enabled (anonymous visitors also need `anonymous_cards`).
 */
export function canSee(actor: LibraryActor | null, stored: StoredItem): boolean {
  const d = stored.detail
  if (d.kind === "external") {
    if (!state.unilibrary.enabled) return false
    if (actor === null) return state.settings.anonymous_cards && d.status === "published"
  }
  if (isLibraryStaff(actor)) return true
  if (actor && stored.ownerId === actor.id) return true
  if (d.status !== "published" || d.visibility === "hidden") return false
  return actor === null ? d.visibility === "public" || d.kind === "external" : true
}

export function visibleItem(actor: LibraryActor | null, idOrSlug: string): StoredItem | undefined {
  const stored = findItem(idOrSlug)
  return stored && canSee(actor, stored) ? stored : undefined
}

/** The card as the caller sees it: shelf state and progress come from the caller's own data. */
export function cardFor(actor: LibraryActor | null, stored: StoredItem): ItemCard {
  const d = stored.detail
  const user = actor && d.id ? state.users.get(actor.id) : undefined
  const progress = d.id ? user?.progress.get(d.id) : undefined
  return {
    ...pickCard(d),
    shelf_state: (d.id ? user?.shelf.get(d.id)?.state : null) ?? null,
    progress_percent: d.kind === "external" ? null : (progress?.percent ?? null),
  }
}

/** Lists (visible to the caller) that contain the item. */
function listsOf(actor: LibraryActor | null, itemId: string): ItemDetail["lists"] {
  const found: ItemDetail["lists"] = []
  for (const list of state.lists.values()) {
    if (!listVisible(actor, list)) continue
    const entry = list.inputs.find((input) => input.item_id === itemId)
    if (entry) found.push({ id: list.detail.id, title: list.detail.title, importance: entry.importance })
  }
  return found
}

export function detailFor(actor: LibraryActor | null, stored: StoredItem): ItemDetail {
  const d = stored.detail
  return {
    ...structuredClone(d),
    ...cardFor(actor, stored),
    lists: d.id ? listsOf(actor, d.id) : [],
    can: libraryCan(actor, d, stored.ownerId),
  }
}

// - - - Reading lists - - -

export function listVisible(actor: LibraryActor | null, list: StoredList): boolean {
  if (!actor) return false
  if (isLibraryStaff(actor) || list.detail.owner.id === actor.id) return true
  return list.detail.status === "published"
}

export function canEditList(actor: LibraryActor | null, list: StoredList): boolean {
  return actor !== null && (isLibraryStaff(actor) || list.detail.owner.id === actor.id)
}

export function listDetailFor(actor: LibraryActor | null, list: StoredList): ReadingListDetail {
  const user = actor ? state.users.get(actor.id) : undefined
  const entries: ReadingListEntry[] = list.inputs.map((input, index) => {
    const stored = input.item_id ? state.items.get(input.item_id) : undefined
    return {
      position: index + 1,
      item: stored && canSee(actor, stored) ? cardFor(actor, stored) : null,
      url: input.url ?? null,
      title: input.title ?? null,
      importance: input.importance,
      page_from: input.page_from ?? null,
      page_to: input.page_to ?? null,
      week_label: input.week_label ?? null,
      due_on: input.due_on ?? null,
      topic_id: input.topic_id ?? null,
      note: input.note ?? null,
      read_state: (input.item_id ? user?.shelf.get(input.item_id)?.state : null) ?? null,
    }
  })
  const essential = entries.filter((e) => e.importance === "essential")
  return {
    ...structuredClone(list.detail),
    entries,
    entry_count: entries.length,
    essential_count: essential.length,
    essential_done: essential.filter((e) => e.read_state === "done").length,
    can_edit: canEditList(actor, list),
  }
}

// - - - Text matching - - -

const CYRILLIC_TO_LATIN: Record<string, string> = {
  ў: "o'",
  ғ: "g'",
  қ: "q",
  ҳ: "h",
  ш: "sh",
  ч: "ch",
  ё: "yo",
  ю: "yu",
  я: "ya",
  ц: "ts",
  э: "e",
  ъ: "'",
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ж: "j",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "x",
  ы: "i",
  ь: "",
}

/** Uzbek search normalisation (§ 3.7): lower case, Cyrillic to Latin, every apostrophe variant to `'`. */
export function uzNormalize(text: string): string {
  return [...text.toLowerCase()]
    .map((ch) => CYRILLIC_TO_LATIN[ch] ?? ch)
    .join("")
    .replace(/[ʻʼ‘’`´]/g, "'")
}

/** Substring match; for Uzbek items the Cyrillic and Latin spellings and the apostrophes are equal. */
export function textMatches(haystack: string, needle: string, uzbek: boolean): boolean {
  const hay = haystack.toLowerCase()
  const q = needle.toLowerCase().trim()
  if (hay.includes(q)) return true
  return uzbek && uzNormalize(haystack).includes(uzNormalize(needle).trim())
}

export const isUzbek = (language: string) => language === "uz_latn" || language === "uz_cyrl"

/** The `…<mark>hit</mark>…` snippet of the first extracted page that contains the query, with its page number. */
export function snippetOf(stored: StoredItem, q: string): { snippet: string; page: number } | null {
  const needle = q.toLowerCase().trim()
  if (!needle) return null
  for (const [index, page] of stored.text.entries()) {
    const at = page.toLowerCase().indexOf(needle)
    if (at < 0) continue
    const start = Math.max(0, at - 30)
    const end = Math.min(page.length, at + needle.length + 30)
    const hit = page.slice(at, at + needle.length)
    const snippet = `${start > 0 ? "…" : ""}${page.slice(start, at)}<mark>${hit}</mark>${page.slice(at + needle.length, end)}${end < page.length ? "…" : ""}`
    return { snippet, page: index + 1 }
  }
  return null
}

/** A subject as `{ id, name }`, or `null` when the id is unknown. */
export function subjectRef(id: string | null | undefined): { id: string; name: string } | null {
  return Object.values(libSubjects).find((s) => s.id === id) ?? null
}

/** A fresh UUID for entities created by handlers (kind 48). */
export function newId(): string {
  state.seq += 1
  return `00000030-0000-4000-8000-${state.seq.toString(16).padStart(12, "0")}`
}
