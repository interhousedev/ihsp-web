import type {
  AddSourcesResult,
  ApplyBody,
  ApplyPreview,
  ArtifactCreate,
  ArtifactDetail,
  ArtifactItem,
  ArtifactKind,
  LabelCreateBody,
  LabelItem,
  LabelPatchBody,
  NotebookCreateBody,
  NotebookDetail,
  NotebookFeedbackBody,
  NotebookMessage,
  NotebookMessageBody,
  NotebookPatchBody,
  NotebookStreamDone,
  NotebookUsage,
  PassageItem,
  SaveNoteBody,
  Slide,
  SlidesPutBody,
  SlidesReviseBody,
  SourceInput,
  SourceItem,
  SourceLabelsBody,
  SourcePatchBody,
  SourceSearchGroup,
  SourcesAddBody,
  SourcesSelectBody,
} from "@ihsp/api"
import { HttpResponse, http } from "msw"
import { fileItems } from "../fixtures/files"
import {
  applyPreviewInvalid,
  applyPreviewPlan,
  applyPreviewStep,
  applyResultPlan,
  applyResultStep,
  artifactCoursePlan,
  artifactLessonDraft,
  courseIds,
  courseWorkspaceDetail,
  courseWorkspaceOpened,
  courseWorkspaceReadOnly,
  workspaceOutline,
} from "../fixtures/course-workspace"
import {
  artifactDetailOf,
  artifactTitleOf,
  labelCalvin,
  labelPhotosynthesis,
  nbMessageAssistant,
  nbMessageAssistantWeb,
  nbMessageUser,
  nbIds,
  notebookArtifacts,
  notebookDetail,
  notebookEmptyDetail,
  notebookItemOf,
  notebookPinnedDetail,
  notebookSources,
  notebookUsage,
  passagesOf,
  sourceDetailOf,
  sourceStale,
  sourceFailed,
} from "../fixtures/notebooks"
import { FIXTURE_NOW, uuid } from "../fixtures/world"
import { apiUrl, matches, nextId, noContent, notFound, paginate, param, problem, query, readJson } from "./utils"
import { spendWebSearch } from "./web-search"

// In-memory backend of the notebooks API. The main notebook starts with three ready sources, one cited chat turn
// and one artifact of every kind. Polling moves things forward: a new source is `pending`, then `processing` after
// the first list request and `ready` after the second; a new artifact is `queued`, then `generating`, then `ready`.

type StoredSource = { item: SourceItem; polls: number; body: string | null; passages: PassageItem[] }
type StoredArtifact = { item: ArtifactItem; polls: number; progressState: unknown; slides: Slide[] | null }
type StoredNotebook = {
  detail: NotebookDetail
  sources: StoredSource[]
  messages: NotebookMessage[]
  artifacts: StoredArtifact[]
  setCreated: boolean
}

function storedSource(item: SourceItem, polls = 0): StoredSource {
  const passages = passagesOf(item.id)
  const body = item.kind === "text" || item.kind === "note" ? passages.map((p) => p.text).join("\n\n") : null
  return { item, polls, body, passages }
}

function freshNotebooks(): Map<string, StoredNotebook> {
  const main: StoredNotebook = {
    detail: { ...notebookDetail },
    sources: notebookSources.map((item) => storedSource({ ...item })),
    messages: [{ ...nbMessageUser }, { ...nbMessageAssistant }],
    artifacts: notebookArtifacts.map((item) => ({
      item: { ...item },
      polls: 0,
      progressState: null,
      slides: null,
    })),
    setCreated: false,
  }
  const pinned: StoredNotebook = {
    detail: { ...notebookPinnedDetail },
    sources: [],
    messages: [],
    artifacts: [],
    setCreated: false,
  }
  const empty: StoredNotebook = {
    detail: { ...notebookEmptyDetail },
    sources: [],
    messages: [],
    artifacts: [],
    setCreated: false,
  }
  const workspace: StoredNotebook = {
    detail: { ...courseWorkspaceDetail },
    sources: notebookSources.slice(0, 2).map((item) => storedSource({ ...item, notebook_id: courseIds.workspace }, 0)),
    messages: [],
    artifacts: [artifactCoursePlan, artifactLessonDraft].map((item) => ({
      item: { ...item },
      polls: 0,
      progressState: null,
      slides: null,
    })),
    setCreated: false,
  }
  return new Map([
    [main.detail.id, main],
    [workspace.detail.id, workspace],
    [pinned.detail.id, pinned],
    [empty.detail.id, empty],
  ])
}

let notebooks = freshNotebooks()

// Topic labels: `POST …/labels/auto` starts a run that finishes on the second `GET …/labels`.
type LabelsState = { items: LabelItem[]; run: "idle" | "running"; polls: number; finishedAt: string | null }
let labelStates = new Map<string, LabelsState>()

function labelsOf(notebookId: string): LabelsState {
  let state = labelStates.get(notebookId)
  if (!state) {
    state = { items: [], run: "idle", polls: 0, finishedAt: null }
    labelStates.set(notebookId, state)
  }
  return state
}

/** How the Apply handlers answer: normally, as if the step changed meanwhile (409), or with a problem list. */
export type CourseApplyMode = "ok" | "conflict" | "invalid"
let courseApplyMode: CourseApplyMode = "ok"
/** True after the course workspace was opened read-only (a `view_drafts` reader). */
let courseReadOnly = false

/** Makes the next Apply calls fail like a stale step (`conflict`, once) or report `invalid` content. */
export function setCourseApplyMode(mode: CourseApplyMode): void {
  courseApplyMode = mode
}

/** Opens the course workspace as a reader (`can_write: false`). */
export function setCourseWorkspaceReadOnly(readOnly: boolean): void {
  courseReadOnly = readOnly
  const state = notebooks.get(courseIds.workspace)
  if (state) state.detail = readOnly ? { ...courseWorkspaceReadOnly } : { ...courseWorkspaceDetail }
}

/** Resets the in-memory notebooks backend; called after every test by `preload.ts`. */
export function resetNotebooksState(): void {
  notebooks = freshNotebooks()
  labelStates = new Map()
  courseApplyMode = "ok"
  courseReadOnly = false
}

/** Adds a source in the state `failed` / `stale` (or any item) to the main notebook, for tests. */
export function seedNotebookSource(item: SourceItem, notebookId: string = nbIds.notebook): void {
  const state = notebooks.get(notebookId)
  if (!state) return
  state.sources.push(storedSource({ ...item, notebook_id: notebookId, position: state.sources.length + 1 }))
  recount(state)
}

export const notebookFixtureSources = { failed: sourceFailed, stale: sourceStale }

function recount(state: StoredNotebook): NotebookDetail {
  const ready = state.sources.filter((s) => s.item.status === "ready" || s.item.status === "stale")
  state.detail = {
    ...state.detail,
    source_count: state.sources.length,
    ready_source_count: ready.length,
    selected_source_count: ready.filter((s) => s.item.selected).length,
  }
  return state.detail
}

function find(id: string): StoredNotebook | undefined {
  return notebooks.get(id)
}

function advanceSource(entry: StoredSource): void {
  if (entry.item.status !== "pending" && entry.item.status !== "processing") return
  entry.polls += 1
  if (entry.polls === 1) entry.item = { ...entry.item, status: "processing" }
  if (entry.polls >= 2) {
    entry.item = {
      ...entry.item,
      status: "ready",
      has_guide: true,
      passage_count: Math.max(entry.passages.length, 1),
      word_count: Math.max(entry.item.word_count, 120),
      synced_at: FIXTURE_NOW,
    }
  }
}

function advanceArtifact(entry: StoredArtifact): void {
  const status = entry.item.status
  if (status !== "queued" && status !== "generating") return
  entry.polls += 1
  if (status === "queued") {
    entry.item = { ...entry.item, status: "generating", progress: 0.3 }
    entry.polls = 1
    return
  }
  if (entry.polls >= 2) {
    entry.item = {
      ...entry.item,
      status: "ready",
      progress: null,
      unread: true,
      title: entry.item.title || artifactTitleOf(entry.item.kind, entry.item.format),
      finished_at: FIXTURE_NOW,
    }
  }
}

function sourceFromInput(
  input: SourceInput,
  notebookId: string,
  position: number,
): { item: SourceItem; body?: string } {
  const base = {
    notebook_id: notebookId,
    status: "pending" as const,
    failure: null,
    selected: true,
    position,
    word_count: 0,
    passage_count: 0,
    origin: null,
    stale: false,
    has_guide: false,
    label_ids: [],
    modality: "text",
    ai_unsupported: false,
    synced_at: null,
    created_at: FIXTURE_NOW,
  }
  const id = nextId(31)
  switch (input.kind) {
    case "file": {
      const file = fileItems.find((item) => item.id === input.file_id)
      return { item: { ...base, id, kind: "file", title: file?.name ?? "File", ref: { file_id: input.file_id } } }
    }
    case "chat":
      return {
        item: {
          ...base,
          id,
          kind: "chat",
          title: "Chat",
          ref: { chat_id: input.chat_id, until_seq: input.until_seq ?? 0 },
        },
      }
    case "lesson_resource":
      return {
        item: {
          ...base,
          id,
          kind: "lesson_resource",
          title: "Lesson material",
          ref: { lesson_id: input.lesson_id, link_id: input.link_id },
        },
      }
    case "flashcard_set":
      return { item: { ...base, id, kind: "flashcard_set", title: "Flash card set", ref: { set_id: input.set_id } } }
    case "lms_step":
      return {
        item: {
          ...base,
          id,
          kind: "lms_step",
          title: "Course step",
          ref: { course_id: input.course_id, step_id: input.step_id },
        },
      }
    case "text":
      return { item: { ...base, id, kind: "text", title: input.title, ref: {} }, body: input.text }
    case "note":
      return { item: { ...base, id, kind: "note", title: input.title, ref: {} }, body: input.body_md }
    case "url":
      return { item: { ...base, id, kind: "url", title: input.title ?? input.url, ref: { url: input.url } } }
  }
}

/** Two sources of the same file, chat, set or step are duplicates (`notebooks/source-duplicate`). */
function refKey(item: SourceItem): string | null {
  if (item.kind === "text" || item.kind === "note") return null
  return `${item.kind}:${JSON.stringify(item.ref)}`
}

function splitPassages(body: string): PassageItem[] {
  return body
    .split(/\n{2,}/)
    .filter((part) => part.trim().length > 0)
    .map((text, index) => ({ id: nextId(32), seq: index + 1, text, page: null, heading: null }))
}

function usageOf(): NotebookUsage {
  let generating = 0
  for (const state of notebooks.values()) {
    generating += state.artifacts.filter((a) => a.item.status === "queued" || a.item.status === "generating").length
  }
  return { ...notebookUsage, generating }
}

function turnFor(state: StoredNotebook, body: Partial<NotebookMessageBody>): Response {
  const selected = state.sources.filter(
    (s) => s.item.selected && (s.item.status === "ready" || s.item.status === "stale"),
  )
  const sourceIds = body.source_ids ?? selected.map((s) => s.item.id)
  if (sourceIds.length === 0) {
    return problem(422, "notebooks/no-sources-selected", "No source selected", {
      messageKey: "notebooks.no-sources-selected",
    })
  }
  if (body.web_search) {
    const refused = spendWebSearch()
    if (refused) return refused
  }
  const lastSeq = state.messages.reduce((max, m) => Math.max(max, m.seq), 0)
  const user: NotebookMessage = {
    ...nbMessageUser,
    id: nextId(34),
    seq: lastSeq + 1,
    text: body.text ?? "",
    source_ids: sourceIds,
    created_at: FIXTURE_NOW,
  }
  const answer = body.web_search ? nbMessageAssistantWeb : nbMessageAssistant
  const assistant: NotebookMessage = { ...answer, id: nextId(34), seq: lastSeq + 2, source_ids: sourceIds }
  state.messages.push(user, assistant)
  return respondTurn(user, assistant)
}

function respondTurn(user: NotebookMessage, assistant: NotebookMessage, acceptsStream = false): Response {
  if (!acceptsStream) {
    return HttpResponse.json({ user_message: user, assistant_message: assistant, usage: usageOf() })
  }
  return sseResponse(user, assistant)
}

function sseResponse(user: NotebookMessage, assistant: NotebookMessage): Response {
  const encoder = new TextEncoder()
  const words = assistant.text.split(/(?<=\s)/)
  const done: NotebookStreamDone = { assistant_message: assistant, user_message: user, usage: usageOf() }
  const events: { event: string; data: unknown }[] = [
    { event: "message", data: { id: user.id, seq: user.seq } },
    ...(assistant.web.length > 0 ? [{ event: "web", data: { results: assistant.web } }] : []),
    ...words.map((text) => ({ event: "delta", data: { text } })),
    ...assistant.citations.map((citation) => ({ event: "citation", data: citation })),
    { event: "done", data: done },
  ]
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const item of events) {
        controller.enqueue(encoder.encode(`event: ${item.event}\ndata: ${JSON.stringify(item.data)}\n\n`))
      }
      controller.close()
    },
  })
  return new HttpResponse(stream, { headers: { "Content-Type": "text/event-stream" } })
}

function wantsStream(request: Request): boolean {
  return (request.headers.get("accept") ?? "").includes("text/event-stream")
}

function createArtifact(state: StoredNotebook, body: ArtifactCreate): Response {
  const generating = [...notebooks.values()]
    .flatMap((s) => s.artifacts)
    .filter((a) => a.item.status === "queued" || a.item.status === "generating")
  if (generating.length >= 3) {
    return problem(409, "notebooks/busy", "Three items are already being created", { messageKey: "notebooks.busy" })
  }
  const ready = state.sources.filter((s) => s.item.selected && s.item.status === "ready")
  const sourceIds = (body.options as { source_ids?: string[] } | undefined)?.source_ids
  if (!sourceIds && ready.length === 0) {
    return problem(422, "notebooks/no-sources-selected", "No source selected", {
      messageKey: "notebooks.no-sources-selected",
    })
  }
  const options = (body.options ?? {}) as ArtifactItem["options"]
  const item: ArtifactItem = {
    id: nextId(33),
    notebook_id: state.detail.id,
    kind: body.kind,
    format: body.kind === "report" ? body.options.format : null,
    title: "",
    status: "queued",
    error: null,
    options,
    prompt: body.prompt ?? null,
    source_count: sourceIds?.length ?? ready.length,
    sampled: false,
    unread: false,
    progress: null,
    has_assets: false,
    parent_id: null,
    flashcard_set_id: null,
    created_at: FIXTURE_NOW,
    finished_at: null,
  }
  state.artifacts.unshift({ item, polls: 0, progressState: null, slides: null })
  return HttpResponse.json(item, { status: 202 })
}

function detailOfStored(entry: StoredArtifact): ArtifactDetail {
  const detail = artifactDetailOf(entry.item)
  const withProgress = { ...detail, progress_state: entry.progressState } as ArtifactDetail
  if (entry.slides && withProgress.kind === "slides" && withProgress.content) {
    return { ...withProgress, content: { ...withProgress.content, slides: entry.slides } }
  }
  return withProgress
}

function applyPreviewFor(entry: StoredArtifact, body: ApplyBody): ApplyPreview | Response {
  const kind = entry.item.kind
  if (kind === "course_plan") return applyPreviewPlan
  if (kind !== "lesson_draft" && kind !== "quiz" && kind !== "flashcards") {
    return problem(422, "notebooks/invalid-options", "This output cannot be applied")
  }
  if (!body.target_step_id && kind !== "lesson_draft") {
    return problem(422, "notebooks/invalid-options", "Choose a step")
  }
  if (courseApplyMode === "invalid") return applyPreviewInvalid
  const base = applyPreviewStep.step!
  const append = kind !== "lesson_draft" || body.mode === "append"
  return {
    ...applyPreviewStep,
    kind,
    step: {
      ...base,
      step_id: body.target_step_id ?? null,
      mode: body.target_step_id ? (append ? "append" : "replace") : "replace",
      current_blocks: body.target_step_id ? base.current_blocks : null,
    },
  }
}

const MAX_LABELS = 12

/** A snippet of about 200 characters around the first of the `words` found in `text`. */
function snippetAround(text: string, words: string[]): string {
  const lower = text.toLowerCase()
  const at = Math.max(0, lower.indexOf(words[0] ?? ""))
  const start = Math.max(0, at - 80)
  return text.slice(start, start + 200)
}

function searchGroups(state: StoredNotebook, q: string): SourceSearchGroup[] {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean)
  const groups: SourceSearchGroup[] = []
  for (const entry of state.sources) {
    if (entry.item.status !== "ready" && entry.item.status !== "stale") continue
    const hits = entry.passages
      .filter((passage) => words.every((word) => passage.text.toLowerCase().includes(word)))
      .slice(0, 3)
      .map((passage) => ({
        passage_id: passage.id,
        seq: passage.seq,
        page: passage.page,
        snippet: snippetAround(passage.text, words),
      }))
    if (hits.length > 0) groups.push({ source_id: entry.item.id, title: entry.item.title, kind: entry.item.kind, hits })
  }
  return groups
}

function withCounts(notebook: StoredNotebook, labels: LabelItem[]): LabelItem[] {
  return labels.map((label) => ({
    ...label,
    source_count: notebook.sources.filter((entry) => entry.item.label_ids.includes(label.id)).length,
  }))
}

/** The auto run finishes: two topic labels, shared out between the selected ready sources. */
function finishAutoRun(notebook: StoredNotebook, labels: LabelsState): void {
  const auto = [labelPhotosynthesis, labelCalvin]
  for (const label of auto) {
    if (!labels.items.some((item) => item.id === label.id)) {
      labels.items.push({ ...label, position: labels.items.length + 1 })
    }
  }
  const targets = notebook.sources.filter((entry) => entry.item.selected && entry.item.status === "ready")
  targets.forEach((entry, index) => {
    const ids = [index % 2 === 0 ? labelPhotosynthesis.id : labelCalvin.id]
    if (index === 1) ids.push(labelPhotosynthesis.id)
    entry.item = { ...entry.item, label_ids: [...new Set([...entry.item.label_ids, ...ids])].slice(0, 3) }
  })
  labels.run = "idle"
  labels.finishedAt = FIXTURE_NOW
}

export const notebooksHandlers = [
  // The notebook of a subject (get or create); the subject hub opens it.
  http.post(apiUrl("/v1/notebooks/auto/subject/:subjectId"), () => HttpResponse.json(notebookDetail)),
  http.get(apiUrl("/v1/notebooks/auto/subject/:subjectId"), () => HttpResponse.json(notebookDetail)),
  // - - - Course workspaces - - -
  http.post(apiUrl("/v1/notebooks/course-workspaces"), () =>
    HttpResponse.json({ ...courseWorkspaceOpened, can_write: !courseReadOnly }),
  ),
  http.get(apiUrl("/v1/notebooks/:id/usage"), ({ params }) =>
    find(param(params, "id")) ? HttpResponse.json(usageOf()) : notFound("Notebook"),
  ),
  http.get(apiUrl("/v1/notebooks/:id/course-steps"), ({ params }) =>
    param(params, "id") === courseIds.workspace ? HttpResponse.json(workspaceOutline) : notFound("Notebook"),
  ),
  http.post(apiUrl("/v1/notebooks/:id/artifacts/:aid/apply-preview"), async ({ params, request }) => {
    const entry = find(param(params, "id"))?.artifacts.find((a) => a.item.id === param(params, "aid"))
    if (!entry) return notFound("Artifact")
    const result = applyPreviewFor(entry, await readJson<ApplyBody>(request))
    return result instanceof Response ? result : HttpResponse.json(result)
  }),
  http.post(apiUrl("/v1/notebooks/:id/artifacts/:aid/apply"), async ({ params, request }) => {
    const entry = find(param(params, "id"))?.artifacts.find((a) => a.item.id === param(params, "aid"))
    if (!entry) return notFound("Artifact")
    if (courseReadOnly) return problem(403, "lms/permission-denied", "Not allowed")
    await readJson<ApplyBody>(request)
    if (courseApplyMode === "conflict") {
      courseApplyMode = "ok"
      return problem(409, "common/conflict", "The step changed")
    }
    return HttpResponse.json(
      entry.item.kind === "course_plan" ? applyResultPlan : { ...applyResultStep, kind: entry.item.kind },
    )
  }),

  // - - - Search and labels - - -
  http.get(apiUrl("/v1/notebooks/:id/search"), ({ params, request }) => {
    const state = find(param(params, "id"))
    if (!state) return notFound("Notebook")
    const q = (query(request).get("q") ?? "").trim()
    if (q.length < 2) return problem(422, "common/validation-failed", "The query is too short")
    return HttpResponse.json({ query: q, sources: searchGroups(state, q) })
  }),
  http.get(apiUrl("/v1/notebooks/:id/labels"), ({ params }) => {
    const state = find(param(params, "id"))
    if (!state) return notFound("Notebook")
    const labels = labelsOf(state.detail.id)
    if (labels.run === "running") {
      labels.polls += 1
      if (labels.polls >= 2) finishAutoRun(state, labels)
    }
    return HttpResponse.json({
      items: withCounts(state, labels.items),
      auto: { status: labels.run, finished_at: labels.finishedAt },
    })
  }),
  http.post(apiUrl("/v1/notebooks/:id/labels/auto"), ({ params }) => {
    const state = find(param(params, "id"))
    if (!state) return notFound("Notebook")
    if (courseReadOnly && state.detail.id === courseIds.workspace) {
      return problem(403, "lms/permission-denied", "Not allowed")
    }
    const labels = labelsOf(state.detail.id)
    if (labels.run === "running") return problem(409, "notebooks/labels-running", "Labelling is already running")
    if (!state.sources.some((entry) => entry.item.selected && entry.item.status === "ready")) {
      return problem(422, "notebooks/labels-nothing-to-label", "No ready source is selected")
    }
    labels.run = "running"
    labels.polls = 0
    return HttpResponse.json({ status: "running" }, { status: 202 })
  }),
  http.post(apiUrl("/v1/notebooks/:id/labels"), async ({ params, request }) => {
    const state = find(param(params, "id"))
    if (!state) return notFound("Notebook")
    if (courseReadOnly && state.detail.id === courseIds.workspace) {
      return problem(403, "lms/permission-denied", "Not allowed")
    }
    const body = await readJson<LabelCreateBody>(request)
    const name = (body.name ?? "").trim()
    const labels = labelsOf(state.detail.id)
    if (!name || name.length > 40) return problem(422, "common/validation-failed", "Invalid label")
    if (labels.items.length >= MAX_LABELS) return problem(409, "notebooks/labels-limit", "Too many labels")
    const item: LabelItem = {
      id: nextId(35),
      name,
      emoji: body.emoji ?? "🏷️",
      position: labels.items.length + 1,
      origin: "manual",
      source_count: 0,
    }
    labels.items.push(item)
    return HttpResponse.json(item, { status: 201 })
  }),
  http.patch(apiUrl("/v1/notebooks/:id/labels/:lid"), async ({ params, request }) => {
    const state = find(param(params, "id"))
    if (!state) return notFound("Notebook")
    const labels = labelsOf(state.detail.id)
    const index = labels.items.findIndex((item) => item.id === param(params, "lid"))
    const label = labels.items[index]
    if (!label) return notFound("Label")
    const body = await readJson<LabelPatchBody>(request)
    const next: LabelItem = {
      ...label,
      ...(body.name !== undefined ? { name: body.name.trim() } : {}),
      ...(body.emoji !== undefined ? { emoji: body.emoji } : {}),
      origin: "manual",
    }
    labels.items[index] = next
    return HttpResponse.json(withCounts(state, [next])[0])
  }),
  http.delete(apiUrl("/v1/notebooks/:id/labels/:lid"), ({ params }) => {
    const state = find(param(params, "id"))
    if (!state) return notFound("Notebook")
    const labels = labelsOf(state.detail.id)
    const id = param(params, "lid")
    if (!labels.items.some((item) => item.id === id)) return notFound("Label")
    labels.items = labels.items.filter((item) => item.id !== id)
    for (const entry of state.sources) {
      entry.item = { ...entry.item, label_ids: entry.item.label_ids.filter((labelId) => labelId !== id) }
    }
    return noContent()
  }),
  http.put(apiUrl("/v1/notebooks/:id/sources/:sid/labels"), async ({ params, request }) => {
    const state = find(param(params, "id"))
    const entry = state?.sources.find((s) => s.item.id === param(params, "sid"))
    if (!state || !entry) return notFound("Source")
    const body = await readJson<SourceLabelsBody>(request)
    const known = new Set(labelsOf(state.detail.id).items.map((item) => item.id))
    const ids = [...new Set(body.label_ids ?? [])]
    if (ids.length > 3 || ids.some((id) => !known.has(id))) {
      return problem(422, "common/validation-failed", "Invalid labels")
    }
    entry.item = { ...entry.item, label_ids: ids }
    return HttpResponse.json(entry.item)
  }),

  // - - - Notebooks - - -
  http.get(apiUrl("/v1/notebooks/usage"), () => HttpResponse.json(usageOf())),
  http.get(apiUrl("/v1/notebooks"), ({ request }) => {
    const q = query(request).get("q")
    const items = [...notebooks.values()]
      .map((state) => notebookItemOf(recount(state)))
      .filter((item) => matches(item.title, q))
      .toSorted(
        (a, b) => Number(b.pinned) - Number(a.pinned) || (b.last_opened_at ?? "").localeCompare(a.last_opened_at ?? ""),
      )
    return HttpResponse.json(paginate(items, request))
  }),
  http.post(apiUrl("/v1/notebooks"), async ({ request }) => {
    const body = await readJson<NotebookCreateBody>(request)
    const detail: NotebookDetail = {
      ...notebookEmptyDetail,
      id: nextId(30),
      title: body.title ?? "Untitled notebook",
      emoji: body.emoji ?? null,
      created_at: FIXTURE_NOW,
      updated_at: FIXTURE_NOW,
    }
    notebooks.set(detail.id, { detail, sources: [], messages: [], artifacts: [], setCreated: false })
    return HttpResponse.json(detail, { status: 201 })
  }),
  http.get(apiUrl("/v1/notebooks/:id"), ({ params }) => {
    const state = find(param(params, "id"))
    return state ? HttpResponse.json(recount(state)) : notFound("Notebook")
  }),
  http.patch(apiUrl("/v1/notebooks/:id"), async ({ params, request }) => {
    const state = find(param(params, "id"))
    if (!state) return notFound("Notebook")
    const body = await readJson<NotebookPatchBody>(request)
    state.detail = {
      ...state.detail,
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.emoji !== undefined ? { emoji: body.emoji } : {}),
      ...(body.pinned !== undefined ? { pinned: body.pinned } : {}),
      ...(body.chat_config !== undefined ? { chat_config: body.chat_config } : {}),
    }
    return HttpResponse.json(recount(state))
  }),
  http.delete(apiUrl("/v1/notebooks/:id"), ({ params }) => {
    const id = param(params, "id")
    if (!notebooks.delete(id)) return notFound("Notebook")
    return noContent()
  }),

  // - - - Sources - - -
  http.get(apiUrl("/v1/notebooks/:id/sources"), ({ params }) => {
    const state = find(param(params, "id"))
    if (!state) return notFound("Notebook")
    for (const entry of state.sources) advanceSource(entry)
    recount(state)
    return HttpResponse.json(state.sources.map((entry) => entry.item))
  }),
  http.post(apiUrl("/v1/notebooks/:id/sources"), async ({ params, request }) => {
    const state = find(param(params, "id"))
    if (!state) return notFound("Notebook")
    const body = await readJson<SourcesAddBody>(request)
    const result: AddSourcesResult = { items: [], rejected: [] }
    const keys = new Set(state.sources.map((entry) => refKey(entry.item)).filter((key) => key !== null))
    ;(body.items ?? []).forEach((input, index) => {
      const created = sourceFromInput(input, state.detail.id, state.sources.length + 1)
      const key = refKey(created.item)
      if (key && keys.has(key)) {
        result.rejected.push({
          index,
          error: {
            type: "notebooks/source-duplicate",
            title: "Already added",
            status: 409,
            message_key: "notebooks.source-duplicate",
            params: {},
          },
        })
        return
      }
      if (key) keys.add(key)
      const entry = storedSource(created.item)
      entry.passages = created.body ? splitPassages(created.body) : []
      entry.body = created.body ?? null
      state.sources.push(entry)
      result.items.push(created.item)
    })
    recount(state)
    return HttpResponse.json(result, { status: 201 })
  }),
  http.post(apiUrl("/v1/notebooks/:id/sources/select"), async ({ params, request }) => {
    const state = find(param(params, "id"))
    if (!state) return notFound("Notebook")
    const body = await readJson<SourcesSelectBody>(request)
    for (const entry of state.sources) {
      if (!body.ids || body.ids.includes(entry.item.id)) {
        entry.item = { ...entry.item, selected: body.selected ?? true }
      }
    }
    recount(state)
    return HttpResponse.json(state.sources.map((entry) => entry.item))
  }),
  http.get(apiUrl("/v1/notebooks/:id/sources/:sid/passages"), ({ params, request }) => {
    const entry = find(param(params, "id"))?.sources.find((s) => s.item.id === param(params, "sid"))
    if (!entry) return notFound("Source")
    return HttpResponse.json(paginate(entry.passages, request))
  }),
  http.post(apiUrl("/v1/notebooks/:id/sources/:sid/sync"), ({ params }) => {
    const entry = find(param(params, "id"))?.sources.find((s) => s.item.id === param(params, "sid"))
    if (!entry) return notFound("Source")
    entry.item = { ...entry.item, status: "processing", stale: false }
    entry.polls = 1
    return HttpResponse.json(entry.item)
  }),
  http.get(apiUrl("/v1/notebooks/:id/sources/:sid"), ({ params }) => {
    const entry = find(param(params, "id"))?.sources.find((s) => s.item.id === param(params, "sid"))
    if (!entry) return notFound("Source")
    const detail = sourceDetailOf(entry.item)
    return HttpResponse.json({ ...detail, body_md: entry.body ?? detail.body_md })
  }),
  http.patch(apiUrl("/v1/notebooks/:id/sources/:sid"), async ({ params, request }) => {
    const state = find(param(params, "id"))
    const entry = state?.sources.find((s) => s.item.id === param(params, "sid"))
    if (!state || !entry) return notFound("Source")
    const body = await readJson<SourcePatchBody>(request)
    entry.item = {
      ...entry.item,
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.selected !== undefined ? { selected: body.selected } : {}),
    }
    if (body.body_md !== undefined) {
      entry.body = body.body_md
      entry.passages = splitPassages(body.body_md)
    }
    recount(state)
    return HttpResponse.json(entry.item)
  }),
  http.delete(apiUrl("/v1/notebooks/:id/sources/:sid"), ({ params }) => {
    const state = find(param(params, "id"))
    if (!state) return notFound("Notebook")
    const before = state.sources.length
    state.sources = state.sources.filter((s) => s.item.id !== param(params, "sid"))
    if (state.sources.length === before) return notFound("Source")
    recount(state)
    return noContent()
  }),
  http.get(apiUrl("/v1/notebooks/:id/passages/:pid"), ({ params, request }) => {
    const state = find(param(params, "id"))
    if (!state) return notFound("Notebook")
    const context = Number(query(request).get("context") ?? 2) || 0
    for (const entry of state.sources) {
      const index = entry.passages.findIndex((p) => p.id === param(params, "pid"))
      const passage = entry.passages[index]
      if (index >= 0 && passage) {
        return HttpResponse.json({
          passage,
          source: { id: entry.item.id, title: entry.item.title, kind: entry.item.kind },
          before: entry.passages.slice(Math.max(0, index - context), index),
          after: entry.passages.slice(index + 1, index + 1 + context),
        })
      }
    }
    return notFound("Passage")
  }),

  // - - - Chat - - -
  http.get(apiUrl("/v1/notebooks/:id/chat"), ({ params }) => {
    const state = find(param(params, "id"))
    return state ? HttpResponse.json({ messages: state.messages }) : notFound("Notebook")
  }),
  http.delete(apiUrl("/v1/notebooks/:id/chat"), ({ params }) => {
    const state = find(param(params, "id"))
    if (!state) return notFound("Notebook")
    state.messages = []
    return noContent()
  }),
  http.post(apiUrl("/v1/notebooks/:id/chat/messages"), async ({ params, request }) => {
    const state = find(param(params, "id"))
    if (!state) return notFound("Notebook")
    const body = await readJson<NotebookMessageBody>(request)
    const result = turnFor(state, body)
    if (!result.ok || !wantsStream(request)) return result
    const user = state.messages[state.messages.length - 2]
    const assistant = state.messages[state.messages.length - 1]
    return user && assistant ? respondTurn(user, assistant, true) : result
  }),
  http.post(apiUrl("/v1/notebooks/:id/chat/regenerate"), ({ params, request }) => {
    const state = find(param(params, "id"))
    if (!state) return notFound("Notebook")
    const last = state.messages[state.messages.length - 1]
    const user = state.messages[state.messages.length - 2]
    if (!last || !user || last.role !== "assistant") return problem(409, "notebooks/busy", "Nothing to regenerate")
    const assistant: NotebookMessage = {
      ...nbMessageAssistant,
      id: nextId(34),
      seq: last.seq,
      source_ids: user.source_ids,
    }
    state.messages = [...state.messages.slice(0, -1), assistant]
    return respondTurn(user, assistant, wantsStream(request))
  }),
  http.post(apiUrl("/v1/notebooks/:id/chat/messages/:mid/feedback"), async ({ params, request }) => {
    const state = find(param(params, "id"))
    if (!state) return notFound("Notebook")
    const body = await readJson<NotebookFeedbackBody>(request)
    state.messages = state.messages.map((m) =>
      m.id === param(params, "mid") ? { ...m, feedback: body.rating ?? null } : m,
    )
    return noContent()
  }),
  http.post(apiUrl("/v1/notebooks/:id/chat/messages/:mid/save-note"), async ({ params, request }) => {
    const state = find(param(params, "id"))
    const message = state?.messages.find((m) => m.id === param(params, "mid"))
    if (!state || !message) return notFound("Message")
    const body = await readJson<SaveNoteBody>(request)
    const created = sourceFromInput(
      { kind: "note", title: body.title ?? "Saved answer", body_md: message.text },
      state.detail.id,
      state.sources.length + 1,
    )
    const entry = storedSource({ ...created.item, status: "ready", has_guide: false, passage_count: 1, word_count: 20 })
    entry.body = message.text
    entry.passages = [{ id: nextId(32), seq: 1, text: message.text, page: null, heading: null }]
    state.sources.push(entry)
    recount(state)
    return HttpResponse.json(entry.item, { status: 201 })
  }),

  // - - - Studio - - -
  http.get(apiUrl("/v1/notebooks/:id/artifacts"), ({ params, request }) => {
    const state = find(param(params, "id"))
    if (!state) return notFound("Notebook")
    for (const entry of state.artifacts) advanceArtifact(entry)
    const kind = query(request).get("kind") as ArtifactKind | null
    const status = query(request).get("status")
    return HttpResponse.json(
      state.artifacts
        .map((e) => e.item)
        .filter((item) => (!kind || item.kind === kind) && (!status || item.status === status)),
    )
  }),
  http.post(apiUrl("/v1/notebooks/:id/artifacts"), async ({ params, request }) => {
    const state = find(param(params, "id"))
    if (!state) return notFound("Notebook")
    const body = await readJson<ArtifactCreate>(request)
    if (!body.kind) return problem(422, "notebooks/invalid-options", "Invalid options")
    return createArtifact(state, body as ArtifactCreate)
  }),
  http.get(apiUrl("/v1/notebooks/:id/artifacts/:aid"), ({ params }) => {
    const entry = find(param(params, "id"))?.artifacts.find((a) => a.item.id === param(params, "aid"))
    if (!entry) return notFound("Artifact")
    entry.item = { ...entry.item, unread: false }
    return HttpResponse.json(detailOfStored(entry))
  }),
  http.patch(apiUrl("/v1/notebooks/:id/artifacts/:aid"), async ({ params, request }) => {
    const entry = find(param(params, "id"))?.artifacts.find((a) => a.item.id === param(params, "aid"))
    if (!entry) return notFound("Artifact")
    const body = await readJson<{ title: string }>(request)
    entry.item = { ...entry.item, title: body.title ?? entry.item.title }
    return HttpResponse.json(entry.item)
  }),
  http.delete(apiUrl("/v1/notebooks/:id/artifacts/:aid"), ({ params }) => {
    const state = find(param(params, "id"))
    if (!state) return notFound("Notebook")
    const before = state.artifacts.length
    state.artifacts = state.artifacts.filter((a) => a.item.id !== param(params, "aid"))
    return state.artifacts.length === before ? notFound("Artifact") : noContent()
  }),
  http.post(apiUrl("/v1/notebooks/:id/artifacts/:aid/cancel"), ({ params }) => {
    const entry = find(param(params, "id"))?.artifacts.find((a) => a.item.id === param(params, "aid"))
    if (!entry) return notFound("Artifact")
    entry.item = { ...entry.item, status: "canceled", progress: null }
    return HttpResponse.json(entry.item)
  }),
  http.post(apiUrl("/v1/notebooks/:id/artifacts/:aid/retry"), ({ params }) => {
    const entry = find(param(params, "id"))?.artifacts.find((a) => a.item.id === param(params, "aid"))
    if (!entry) return notFound("Artifact")
    entry.item = { ...entry.item, status: "queued", error: null }
    entry.polls = 0
    return HttpResponse.json(entry.item, { status: 202 })
  }),
  http.put(apiUrl("/v1/notebooks/:id/artifacts/:aid/progress"), async ({ params, request }) => {
    const entry = find(param(params, "id"))?.artifacts.find((a) => a.item.id === param(params, "aid"))
    if (!entry) return notFound("Artifact")
    entry.progressState = (await readJson<{ state: unknown }>(request)).state ?? null
    return noContent()
  }),
  http.post(apiUrl("/v1/notebooks/:id/artifacts/:aid/save-as-source"), ({ params }) => {
    const state = find(param(params, "id"))
    const entry = state?.artifacts.find((a) => a.item.id === param(params, "aid"))
    if (!state || !entry) return notFound("Artifact")
    const created = sourceFromInput(
      { kind: "note", title: entry.item.title || "Report", body_md: "Report" },
      state.detail.id,
      state.sources.length + 1,
    )
    const source = storedSource({ ...created.item, status: "ready", passage_count: 1, word_count: 120 })
    state.sources.push(source)
    recount(state)
    return HttpResponse.json(source.item, { status: 201 })
  }),
  http.post(apiUrl("/v1/notebooks/:id/artifacts/:aid/flashcard-set"), ({ params }) => {
    const state = find(param(params, "id"))
    const entry = state?.artifacts.find((a) => a.item.id === param(params, "aid"))
    if (!state || !entry) return notFound("Artifact")
    const created = entry.item.flashcard_set_id === null
    const setId = entry.item.flashcard_set_id ?? uuid(12, 1)
    entry.item = { ...entry.item, flashcard_set_id: setId }
    return HttpResponse.json({ set_id: setId, created })
  }),
  http.put(apiUrl("/v1/notebooks/:id/artifacts/:aid/slides"), async ({ params, request }) => {
    const entry = find(param(params, "id"))?.artifacts.find((a) => a.item.id === param(params, "aid"))
    if (!entry) return notFound("Artifact")
    const body = await readJson<SlidesPutBody>(request)
    entry.slides = body.slides ?? null
    return HttpResponse.json(detailOfStored(entry))
  }),
  http.post(apiUrl("/v1/notebooks/:id/artifacts/:aid/slides/revise"), async ({ params, request }) => {
    const state = find(param(params, "id"))
    const entry = state?.artifacts.find((a) => a.item.id === param(params, "aid"))
    if (!state || !entry) return notFound("Artifact")
    await readJson<SlidesReviseBody>(request)
    const item: ArtifactItem = {
      ...entry.item,
      id: nextId(33),
      status: "queued",
      parent_id: entry.item.id,
      unread: false,
      finished_at: null,
    }
    state.artifacts.unshift({ item, polls: 0, progressState: null, slides: null })
    return HttpResponse.json(item, { status: 202 })
  }),
]
