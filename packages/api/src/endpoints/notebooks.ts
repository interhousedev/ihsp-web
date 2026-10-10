// Notebooks (NotebookLM-style): notebooks, sources, grounded chat and Studio artifacts.
// docs/reference/notebooklm.md § 4.3. Student only; a notebook of another user answers 404.

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, seg, type RequestOptions } from "../query"
import type { NoContent, Page } from "../types/common"
import type {
  AddSourcesResult,
  ArtifactCreate,
  ArtifactDetail,
  ArtifactItem,
  ArtifactPatchBody,
  ArtifactProgressBody,
  ArtifactsParams,
  DiscoverBody,
  DiscoverResponse,
  FlashcardSetResult,
  LabelCreateBody,
  LabelItem,
  LabelPatchBody,
  LabelsAutoResult,
  LabelsResponse,
  NotebookChatHistory,
  NotebookCreateBody,
  NotebookDetail,
  NotebookFeedbackBody,
  NotebookItem,
  NotebookMessageBody,
  NotebookPatchBody,
  NotebookTurn,
  NotebookUsage,
  PassageDetail,
  PassageItem,
  PassageParams,
  PassagesParams,
  SaveNoteBody,
  SaveToFilesBody,
  SavedArtifactFile,
  SlidesPutBody,
  SlidesReviseBody,
  SourceDetail,
  AttachArtifactBody,
  AttachedResource,
  SourceItem,
  SourceLabelsBody,
  SourcePatchBody,
  SourceSearchParams,
  SourceSearchResponse,
  SourcesAddBody,
  SourcesSelectBody,
  NotebooksParams,
  SubjectMaterial,
  SubjectMaterialCreateBody,
  SubjectMaterialGroup,
} from "../types/notebooks"

// - - - Notebooks - - -

/** GET /v1/notebooks?q&cursor&limit — pinned first, then by last opened. */
export function getNotebooks(params?: NotebooksParams, opts?: RequestOptions): Promise<Page<NotebookItem>> {
  return api.get<Page<NotebookItem>>("/v1/notebooks", {
    ...opts,
    query: params,
  })
}
export const getNotebooksQuery = (params?: NotebooksParams) =>
  queryOptions({
    queryKey: keys.notebooks.list(params),
    queryFn: ({ signal }) => getNotebooks(params, { signal }),
  })

/** POST /v1/notebooks — `201`; the default title is "Untitled notebook" in the user's locale. */
export function postNotebook(body?: NotebookCreateBody, opts?: RequestOptions): Promise<NotebookDetail> {
  return api.post<NotebookDetail>("/v1/notebooks", body ?? {}, opts)
}

/** POST /v1/notebooks/auto/subject/{subject_id} — student; gets or creates the notebook of a subject. */
export function postNotebookAutoSubject(subjectId: string, opts?: RequestOptions): Promise<NotebookDetail> {
  return api.post<NotebookDetail>(`/v1/notebooks/auto/subject/${seg(subjectId)}`, undefined, opts)
}

/** GET /v1/notebooks/auto/subject/{subject_id} — student; the notebook of a subject if it exists (404 otherwise). */
export function getNotebookAutoSubject(subjectId: string, opts?: RequestOptions): Promise<NotebookDetail> {
  return api.get<NotebookDetail>(`/v1/notebooks/auto/subject/${seg(subjectId)}`, opts)
}
export const getNotebookAutoSubjectQuery = (subjectId: string) =>
  queryOptions({
    queryKey: ["notebooks", "auto", "subject", subjectId] as const,
    queryFn: ({ signal }) => getNotebookAutoSubject(subjectId, { signal }),
  })

/** GET /v1/notebooks/usage — budget (session and day) and the quota counters. */
export function getNotebookUsage(opts?: RequestOptions): Promise<NotebookUsage> {
  return api.get<NotebookUsage>("/v1/notebooks/usage", opts)
}
export const getNotebookUsageQuery = () =>
  queryOptions({
    queryKey: keys.notebooks.usage(),
    queryFn: ({ signal }) => getNotebookUsage({ signal }),
  })

/** GET /v1/notebooks/{id} — sets `last_opened_at`. */
export function getNotebook(id: string, opts?: RequestOptions): Promise<NotebookDetail> {
  return api.get<NotebookDetail>(`/v1/notebooks/${seg(id)}`, opts)
}
export const getNotebookQuery = (id: string) =>
  queryOptions({
    queryKey: keys.notebooks.detail(id),
    queryFn: ({ signal }) => getNotebook(id, { signal }),
  })

/** PATCH /v1/notebooks/{id} — title, emoji, pin, chat configuration. */
export function patchNotebook(id: string, body: NotebookPatchBody, opts?: RequestOptions): Promise<NotebookDetail> {
  return api.patch<NotebookDetail>(`/v1/notebooks/${seg(id)}`, body, opts)
}

/** DELETE /v1/notebooks/{id} — `204`. */
export function deleteNotebook(id: string, opts?: RequestOptions): Promise<NoContent> {
  return api.delete<NoContent>(`/v1/notebooks/${seg(id)}`, opts)
}

// - - - Sources - - -

/** GET /v1/notebooks/{id}/sources */
export function getNotebookSources(id: string, opts?: RequestOptions): Promise<SourceItem[]> {
  return api.get<SourceItem[]>(`/v1/notebooks/${seg(id)}/sources`, opts)
}
export const getNotebookSourcesQuery = (id: string) =>
  queryOptions({
    queryKey: keys.notebooks.sources(id),
    queryFn: ({ signal }) => getNotebookSources(id, { signal }),
  })

/** POST /v1/notebooks/{id}/sources — 1 to 20 items; `201` with the created sources and the rejected ones. */
export function postNotebookSources(
  id: string,
  body: SourcesAddBody,
  opts?: RequestOptions,
): Promise<AddSourcesResult> {
  return api.post<AddSourcesResult>(`/v1/notebooks/${seg(id)}/sources`, body, opts)
}

/** GET /v1/notebooks/{id}/sources/{sid} — with the source guide and the note body. */
export function getNotebookSource(id: string, sourceId: string, opts?: RequestOptions): Promise<SourceDetail> {
  return api.get<SourceDetail>(`/v1/notebooks/${seg(id)}/sources/${seg(sourceId)}`, opts)
}
export const getNotebookSourceQuery = (id: string, sourceId: string) =>
  queryOptions({
    queryKey: keys.notebooks.source(id, sourceId),
    queryFn: ({ signal }) => getNotebookSource(id, sourceId, { signal }),
  })

/** PATCH /v1/notebooks/{id}/sources/{sid} — rename, select, edit a note or pasted text. */
export function patchNotebookSource(
  id: string,
  sourceId: string,
  body: SourcePatchBody,
  opts?: RequestOptions,
): Promise<SourceItem> {
  return api.patch<SourceItem>(`/v1/notebooks/${seg(id)}/sources/${seg(sourceId)}`, body, opts)
}

/** POST /v1/notebooks/{id}/sources/select — all sources when `ids` is absent. */
export function postNotebookSourcesSelect(
  id: string,
  body: SourcesSelectBody,
  opts?: RequestOptions,
): Promise<SourceItem[]> {
  return api.post<SourceItem[]>(`/v1/notebooks/${seg(id)}/sources/select`, body, opts)
}

/** POST /v1/notebooks/{id}/sources/{sid}/sync — the source goes to `processing`. */
export function postNotebookSourceSync(id: string, sourceId: string, opts?: RequestOptions): Promise<SourceItem> {
  return api.post<SourceItem>(`/v1/notebooks/${seg(id)}/sources/${seg(sourceId)}/sync`, undefined, opts)
}

/** DELETE /v1/notebooks/{id}/sources/{sid} — `204`. */
export function deleteNotebookSource(id: string, sourceId: string, opts?: RequestOptions): Promise<NoContent> {
  return api.delete<NoContent>(`/v1/notebooks/${seg(id)}/sources/${seg(sourceId)}`, opts)
}

/** GET /v1/notebooks/{id}/sources/{sid}/passages?cursor&limit — the text of the source viewer (default 60). */
export function getSourcePassages(
  id: string,
  sourceId: string,
  params?: PassagesParams,
  opts?: RequestOptions,
): Promise<Page<PassageItem>> {
  return api.get<Page<PassageItem>>(`/v1/notebooks/${seg(id)}/sources/${seg(sourceId)}/passages`, {
    ...opts,
    query: params,
  })
}

/** GET /v1/notebooks/{id}/passages/{pid}?context=2 — one passage with its neighbours. */
export function getPassage(
  id: string,
  passageId: string,
  params?: PassageParams,
  opts?: RequestOptions,
): Promise<PassageDetail> {
  return api.get<PassageDetail>(`/v1/notebooks/${seg(id)}/passages/${seg(passageId)}`, { ...opts, query: params })
}
export const getPassageQuery = (id: string, passageId: string, params?: PassageParams) =>
  queryOptions({
    queryKey: keys.notebooks.passage(id, passageId, params?.context),
    queryFn: ({ signal }) => getPassage(id, passageId, params, { signal }),
  })

/** GET /v1/notebooks/{id}/search?q&limit — full-text search over the ready sources, grouped by source. */
export function getNotebookSearch(
  id: string,
  params: SourceSearchParams,
  opts?: RequestOptions,
): Promise<SourceSearchResponse> {
  return api.get<SourceSearchResponse>(`/v1/notebooks/${seg(id)}/search`, {
    ...opts,
    query: params,
  })
}
export const getNotebookSearchQuery = (id: string, params: SourceSearchParams) =>
  queryOptions({
    queryKey: keys.notebooks.search(id, params.q),
    queryFn: ({ signal }) => getNotebookSearch(id, params, { signal }),
  })

/** POST /v1/notebooks/{id}/discover — web pages to add as `url` sources; spends today's searches (1 fast, `deep_cost` deep). */
export function postNotebookDiscover(id: string, body: DiscoverBody, opts?: RequestOptions): Promise<DiscoverResponse> {
  return api.post<DiscoverResponse>(`/v1/notebooks/${seg(id)}/discover`, body, opts)
}

// - - - Labels - - -

/** GET /v1/notebooks/{id}/labels — the topic labels and the state of the last auto-labelling run. */
export function getNotebookLabels(id: string, opts?: RequestOptions): Promise<LabelsResponse> {
  return api.get<LabelsResponse>(`/v1/notebooks/${seg(id)}/labels`, opts)
}
export const getNotebookLabelsQuery = (id: string) =>
  queryOptions({
    queryKey: keys.notebooks.labels(id),
    queryFn: ({ signal }) => getNotebookLabels(id, { signal }),
  })

/** POST /v1/notebooks/{id}/labels — a manual label; `201`. */
export function postNotebookLabel(id: string, body: LabelCreateBody, opts?: RequestOptions): Promise<LabelItem> {
  return api.post<LabelItem>(`/v1/notebooks/${seg(id)}/labels`, body, opts)
}

/** PATCH /v1/notebooks/{id}/labels/{label_id} — rename or change the emoji (an auto label becomes manual). */
export function patchNotebookLabel(
  id: string,
  labelId: string,
  body: LabelPatchBody,
  opts?: RequestOptions,
): Promise<LabelItem> {
  return api.patch<LabelItem>(`/v1/notebooks/${seg(id)}/labels/${seg(labelId)}`, body, opts)
}

/** DELETE /v1/notebooks/{id}/labels/{label_id} — `204`. */
export function deleteNotebookLabel(id: string, labelId: string, opts?: RequestOptions): Promise<NoContent> {
  return api.delete<NoContent>(`/v1/notebooks/${seg(id)}/labels/${seg(labelId)}`, opts)
}

/** PUT /v1/notebooks/{id}/sources/{sid}/labels — replaces the labels of one source (at most 3). */
export function putNotebookSourceLabels(
  id: string,
  sourceId: string,
  body: SourceLabelsBody,
  opts?: RequestOptions,
): Promise<SourceItem> {
  return api.put<SourceItem>(`/v1/notebooks/${seg(id)}/sources/${seg(sourceId)}/labels`, body, opts)
}

/** POST /v1/notebooks/{id}/labels/auto — labels the selected sources in the background; `202`. */
export function postNotebookLabelsAuto(id: string, opts?: RequestOptions): Promise<LabelsAutoResult> {
  return api.post<LabelsAutoResult>(`/v1/notebooks/${seg(id)}/labels/auto`, {}, opts)
}

// - - - Chat - - -

/** GET /v1/notebooks/{id}/chat — the last 200 messages, ascending. */
export function getNotebookChat(id: string, opts?: RequestOptions): Promise<NotebookChatHistory> {
  return api.get<NotebookChatHistory>(`/v1/notebooks/${seg(id)}/chat`, opts)
}
export const getNotebookChatQuery = (id: string) =>
  queryOptions({
    queryKey: keys.notebooks.chat(id),
    queryFn: ({ signal }) => getNotebookChat(id, { signal }),
  })

/** POST /v1/notebooks/{id}/chat/messages — one grounded question, answered as JSON. */
export function postNotebookMessage(
  id: string,
  body: NotebookMessageBody,
  opts?: RequestOptions,
): Promise<NotebookTurn> {
  return api.post<NotebookTurn>(`/v1/notebooks/${seg(id)}/chat/messages`, body, opts)
}

/** Streaming variant of `POST /v1/notebooks/{id}/chat/messages` (`Accept: text/event-stream`): the raw SSE `Response` (P1b). */
export function streamNotebookMessage(id: string, body: NotebookMessageBody, opts?: RequestOptions): Promise<Response> {
  return api.request<Response>({
    method: "POST",
    path: `/v1/notebooks/${seg(id)}/chat/messages`,
    body,
    headers: { Accept: "text/event-stream" },
    responseType: "stream",
    signal: opts?.signal,
  })
}

/** POST /v1/notebooks/{id}/chat/regenerate — answers the last user message again (P1b). */
export function postNotebookRegenerate(id: string, opts?: RequestOptions): Promise<NotebookTurn> {
  return api.post<NotebookTurn>(`/v1/notebooks/${seg(id)}/chat/regenerate`, undefined, opts)
}

/** Streaming variant of `POST /v1/notebooks/{id}/chat/regenerate` (`Accept: text/event-stream`): the raw SSE `Response` (P1b). */
export function streamNotebookRegenerate(id: string, opts?: RequestOptions): Promise<Response> {
  return api.request<Response>({
    method: "POST",
    path: `/v1/notebooks/${seg(id)}/chat/regenerate`,
    headers: { Accept: "text/event-stream" },
    responseType: "stream",
    signal: opts?.signal,
  })
}

/** DELETE /v1/notebooks/{id}/chat — deletes the chat history; `204`. */
export function deleteNotebookChat(id: string, opts?: RequestOptions): Promise<NoContent> {
  return api.delete<NoContent>(`/v1/notebooks/${seg(id)}/chat`, opts)
}

/** POST /v1/notebooks/{id}/chat/messages/{mid}/feedback — thumbs up or down (P1b); `204`. */
export function postNotebookFeedback(
  id: string,
  messageId: string,
  body: NotebookFeedbackBody,
  opts?: RequestOptions,
): Promise<NoContent> {
  return api.post<NoContent>(`/v1/notebooks/${seg(id)}/chat/messages/${seg(messageId)}/feedback`, body, opts)
}

/** POST /v1/notebooks/{id}/chat/messages/{mid}/save-note — `201`; creates a `note` source from the answer. */
export function postSaveNote(
  id: string,
  messageId: string,
  body?: SaveNoteBody,
  opts?: RequestOptions,
): Promise<SourceItem> {
  return api.post<SourceItem>(`/v1/notebooks/${seg(id)}/chat/messages/${seg(messageId)}/save-note`, body ?? {}, opts)
}

// - - - Studio - - -

/** GET /v1/notebooks/{id}/artifacts?kind&status — newest first, without content. */
export function getArtifacts(id: string, params?: ArtifactsParams, opts?: RequestOptions): Promise<ArtifactItem[]> {
  return api.get<ArtifactItem[]>(`/v1/notebooks/${seg(id)}/artifacts`, {
    ...opts,
    query: params,
  })
}
export const getArtifactsQuery = (id: string, params?: ArtifactsParams) =>
  queryOptions({
    queryKey: keys.notebooks.artifacts(id, params),
    queryFn: ({ signal }) => getArtifacts(id, params, { signal }),
  })

/** POST /v1/notebooks/{id}/artifacts — `202`; the artifact is `queued`. */
export function postArtifact(id: string, body: ArtifactCreate, opts?: RequestOptions): Promise<ArtifactItem> {
  return api.post<ArtifactItem>(`/v1/notebooks/${seg(id)}/artifacts`, body, opts)
}

/** GET /v1/notebooks/{id}/artifacts/{aid} — sets `viewed_at`. */
export function getArtifact(id: string, artifactId: string, opts?: RequestOptions): Promise<ArtifactDetail> {
  return api.get<ArtifactDetail>(`/v1/notebooks/${seg(id)}/artifacts/${seg(artifactId)}`, opts)
}
export const getArtifactQuery = (id: string, artifactId: string) =>
  queryOptions({
    queryKey: keys.notebooks.artifact(id, artifactId),
    queryFn: ({ signal }) => getArtifact(id, artifactId, { signal }),
  })

/** GET /v1/notebooks/{id}/artifacts/{aid}/download — a ready report or quiz (.docx), table (.xlsx), deck (.pptx), flash cards (.csv), else Markdown; `json` for any. */
export function getArtifactDownload(
  id: string,
  artifactId: string,
  format?: "docx" | "xlsx" | "pptx" | "csv" | "md" | "json",
  opts?: RequestOptions,
): Promise<Blob> {
  return api.get<Blob>(`/v1/notebooks/${seg(id)}/artifacts/${seg(artifactId)}/download`, {
    ...opts,
    query: format ? { format } : undefined,
    responseType: "blob",
  })
}

/** PATCH /v1/notebooks/{id}/artifacts/{aid} — rename. */
export function patchArtifact(
  id: string,
  artifactId: string,
  body: ArtifactPatchBody,
  opts?: RequestOptions,
): Promise<ArtifactItem> {
  return api.patch<ArtifactItem>(`/v1/notebooks/${seg(id)}/artifacts/${seg(artifactId)}`, body, opts)
}

/** DELETE /v1/notebooks/{id}/artifacts/{aid} — `204`. */
export function deleteArtifact(id: string, artifactId: string, opts?: RequestOptions): Promise<NoContent> {
  return api.delete<NoContent>(`/v1/notebooks/${seg(id)}/artifacts/${seg(artifactId)}`, opts)
}

/** POST /v1/notebooks/{id}/artifacts/{aid}/cancel */
export function postArtifactCancel(id: string, artifactId: string, opts?: RequestOptions): Promise<ArtifactItem> {
  return api.post<ArtifactItem>(`/v1/notebooks/${seg(id)}/artifacts/${seg(artifactId)}/cancel`, undefined, opts)
}

/** POST /v1/notebooks/{id}/artifacts/{aid}/retry — `202`. */
export function postArtifactRetry(id: string, artifactId: string, opts?: RequestOptions): Promise<ArtifactItem> {
  return api.post<ArtifactItem>(`/v1/notebooks/${seg(id)}/artifacts/${seg(artifactId)}/retry`, undefined, opts)
}

/** PUT /v1/notebooks/{id}/artifacts/{aid}/progress — flash cards and quiz progress (at most 16 KB); `204`. */
export function putArtifactProgress(
  id: string,
  artifactId: string,
  body: ArtifactProgressBody,
  opts?: RequestOptions,
): Promise<NoContent> {
  return api.put<NoContent>(`/v1/notebooks/${seg(id)}/artifacts/${seg(artifactId)}/progress`, body, opts)
}

/** POST /v1/notebooks/{id}/artifacts/{aid}/save-as-source — reports; `201`. */
export function postArtifactAsSource(id: string, artifactId: string, opts?: RequestOptions): Promise<SourceItem> {
  return api.post<SourceItem>(`/v1/notebooks/${seg(id)}/artifacts/${seg(artifactId)}/save-as-source`, undefined, opts)
}

/** POST /v1/notebooks/{id}/artifacts/{aid}/save-to-files — a copy in "My files" (Office file, or Markdown); `201`. */
export function postArtifactSaveToFiles(
  id: string,
  artifactId: string,
  body?: SaveToFilesBody,
  opts?: RequestOptions,
): Promise<SavedArtifactFile> {
  return api.post<SavedArtifactFile>(
    `/v1/notebooks/${seg(id)}/artifacts/${seg(artifactId)}/save-to-files`,
    body ?? {},
    opts,
  )
}

/** POST /v1/notebooks/{id}/artifacts/{aid}/attach-to-lesson — teachers; a report, table or slides as a lesson file; `201`. */
export function postArtifactAttachToLesson(
  id: string,
  artifactId: string,
  body: AttachArtifactBody,
  opts?: RequestOptions,
): Promise<AttachedResource> {
  return api.post<AttachedResource>(
    `/v1/notebooks/${seg(id)}/artifacts/${seg(artifactId)}/attach-to-lesson`,
    body,
    opts,
  )
}

/** POST /v1/notebooks/{id}/artifacts/{aid}/flashcard-set — flash cards; idempotent. */
export function postArtifactFlashcardSet(
  id: string,
  artifactId: string,
  opts?: RequestOptions,
): Promise<FlashcardSetResult> {
  return api.post<FlashcardSetResult>(
    `/v1/notebooks/${seg(id)}/artifacts/${seg(artifactId)}/flashcard-set`,
    undefined,
    opts,
  )
}

/** PUT /v1/notebooks/{id}/artifacts/{aid}/slides — edit, reorder or delete slides (P2). */
export function putArtifactSlides(
  id: string,
  artifactId: string,
  body: SlidesPutBody,
  opts?: RequestOptions,
): Promise<ArtifactDetail> {
  return api.put<ArtifactDetail>(`/v1/notebooks/${seg(id)}/artifacts/${seg(artifactId)}/slides`, body, opts)
}

/** POST /v1/notebooks/{id}/artifacts/{aid}/slides/revise — `202`; a new artifact with `parent_id` set (P2). */
export function postArtifactSlidesRevise(
  id: string,
  artifactId: string,
  body: SlidesReviseBody,
  opts?: RequestOptions,
): Promise<ArtifactItem> {
  return api.post<ArtifactItem>(`/v1/notebooks/${seg(id)}/artifacts/${seg(artifactId)}/slides/revise`, body, opts)
}

// --- Default materials of a subject (admin) ---

/** GET /v1/admin/subject-materials — admin; the default materials of every EMIS subject id, grouped, by id. */
export function getAdminSubjectMaterialGroups(opts?: RequestOptions): Promise<SubjectMaterialGroup[]> {
  return api.get<SubjectMaterialGroup[]>("/v1/admin/subject-materials", opts)
}
export const getAdminSubjectMaterialGroupsQuery = () =>
  queryOptions({
    queryKey: keys.admin.subjectMaterials.groups(),
    queryFn: ({ signal }) => getAdminSubjectMaterialGroups({ signal }),
  })

/** GET /v1/admin/subject-materials/{id} — admin; the default materials of one EMIS subject id, by position. */
export function getAdminSubjectMaterials(eduSubjectId: number, opts?: RequestOptions): Promise<SubjectMaterial[]> {
  return api.get<SubjectMaterial[]>(`/v1/admin/subject-materials/${seg(eduSubjectId)}`, opts)
}
export const getAdminSubjectMaterialsQuery = (eduSubjectId: number) =>
  queryOptions({
    queryKey: keys.admin.subjectMaterials.list(eduSubjectId),
    queryFn: ({ signal }) => getAdminSubjectMaterials(eduSubjectId, { signal }),
  })

/**
 * POST /v1/admin/subject-materials/{id} — admin; `201`. `409 notebooks/default-material-exists | -limit` (30 per
 * subject), `422 notebooks/default-material-invalid`.
 */
export function postAdminSubjectMaterial(
  eduSubjectId: number,
  body: SubjectMaterialCreateBody,
  opts?: RequestOptions,
): Promise<SubjectMaterial> {
  return api.post<SubjectMaterial>(`/v1/admin/subject-materials/${seg(eduSubjectId)}`, body, opts)
}

/** DELETE /v1/admin/subject-materials/{id}/{material_id} — admin; `204`, `404 notebooks/default-material-not-found`. */
export function deleteAdminSubjectMaterial(
  eduSubjectId: number,
  materialId: string,
  opts?: RequestOptions,
): Promise<NoContent> {
  return api.delete<NoContent>(`/v1/admin/subject-materials/${seg(eduSubjectId)}/${seg(materialId)}`, opts)
}
