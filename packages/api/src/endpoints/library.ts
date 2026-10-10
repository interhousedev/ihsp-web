// Library: catalogue, reader state, uploads and the librarian area (docs/reference/study-library.md §§ 7.1, 7.2).
// Routes marked *anon* in the document also work without a token for public items. Projects (§ 7.3) are not here.

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, seg, type RequestOptions } from "../query"
import type { NoContent, Page } from "../types/common"
import type {
  Annotation,
  AnnotationInput,
  AnnotationPatchBody,
  AnnotationsParams,
  AnnotationsSyncBody,
  BookAction,
  BookActionBody,
  BookDraft,
  BookFileBody,
  BookInput,
  BookRow,
  BookRowsParams,
  Collection,
  CollectionDetail,
  CollectionInput,
  Feed,
  FeedAction,
  FeedInput,
  FieldMapEntry,
  ImportBody,
  ImportResult,
  ItemCard,
  ItemDetail,
  ItemFile,
  ItemFileUrl,
  ItemText,
  ItemTextParams,
  ItemsParams,
  LibraryGroup,
  LibraryStats,
  ManageCollection,
  ManageQueueRow,
  ManageTopic,
  MaterialFilesBody,
  MaterialInput,
  MaterialPatchBody,
  MeLibrary,
  ModerationAction,
  ModerationBody,
  PinExternalBody,
  ProgressBody,
  QueueParams,
  ReadingListCard,
  ReadingListDetail,
  ReadingListInput,
  ReadingListItemInput,
  ReadingListsParams,
  LibraryReportBody,
  LibrarySubject,
  ReportResolveBody,
  Sanction,
  SanctionBody,
  ShelfEntry,
  ShelfParams,
  ShelfState,
  SuggestionBody,
  SuggestionDetail,
  SubjectInput,
  SubjectPatch,
  ManageSubject,
  TagSuggestion,
  TopicPatch,
  Topic,
  TopicInput,
  UniLibrarySearchParams,
  UniLibrarySearchResult,
  UniLibrarySettings,
  UniLibraryStatus,
  UniLibraryTaxonomy,
  UploadRow,
  UploadsParams,
} from "../types/library"

// - - - Catalogue (anon) - - -

/** GET /v1/library/items — *anon* (public items only). Full-text hits carry `snippet` and `snippet_page`. */
export function getLibraryItems(params?: ItemsParams, opts?: RequestOptions): Promise<Page<ItemCard>> {
  return api.get<Page<ItemCard>>("/v1/library/items", { ...opts, query: params })
}
export const getLibraryItemsQuery = (params?: ItemsParams) =>
  queryOptions({
    queryKey: keys.library.items(params),
    queryFn: ({ signal }) => getLibraryItems(params, { signal }),
  })

/** GET /v1/library/items/{id_or_slug} — *anon*. `404 library/not-found` also for items the caller may not see. */
export function getLibraryItem(idOrSlug: string, opts?: RequestOptions): Promise<ItemDetail> {
  return api.get<ItemDetail>(`/v1/library/items/${seg(idOrSlug)}`, opts)
}
export const getLibraryItemQuery = (idOrSlug: string) =>
  queryOptions({
    queryKey: keys.library.item(idOrSlug),
    queryFn: ({ signal }) => getLibraryItem(idOrSlug, { signal }),
  })

/** GET /v1/library/items/{id}/files/{fid}/url — *anon for public*; 15 minutes. `409 library/not-supported` for external. */
export function getLibraryFileUrl(
  itemId: string,
  fileId: string,
  params?: { inline?: boolean },
  opts?: RequestOptions,
): Promise<ItemFileUrl> {
  return api.get<ItemFileUrl>(`/v1/library/items/${seg(itemId)}/files/${seg(fileId)}/url`, {
    ...opts,
    query: params?.inline ? { inline: 1 } : undefined,
  })
}

/** GET /v1/library/items/{id}/text — pages of extracted text (rights and status checked). */
export function getLibraryItemText(id: string, params?: ItemTextParams, opts?: RequestOptions): Promise<ItemText> {
  return api.get<ItemText>(`/v1/library/items/${seg(id)}/text`, { ...opts, query: params })
}
export const getLibraryItemTextQuery = (id: string, params?: ItemTextParams) =>
  queryOptions({
    queryKey: keys.library.text(id, params),
    queryFn: ({ signal }) => getLibraryItemText(id, params, { signal }),
  })

/**
 * GET /v1/library/subjects — *anon*; subjects that have visible items, with their counts (not in the document's § 7.1).
 * `all: true` returns every active subject (counts may be 0) for pickers in the upload and librarian forms.
 */
export function getLibrarySubjects(params?: { all?: boolean }, opts?: RequestOptions): Promise<LibrarySubject[]> {
  return api.get<LibrarySubject[]>("/v1/library/subjects", { ...opts, query: params?.all ? { all: 1 } : undefined })
}
export const getLibrarySubjectsQuery = (params?: { all?: boolean }) =>
  queryOptions({
    queryKey: keys.library.subjects(params?.all),
    queryFn: ({ signal }) => getLibrarySubjects(params, { signal }),
  })

/** GET /v1/library/authors?q — fuzzy author names (Latin and Cyrillic spellings meet); `q` may be empty. */
export function getLibraryAuthors(q: string, opts?: RequestOptions): Promise<string[]> {
  return api.get<string[]>("/v1/library/authors", { ...opts, query: { q } })
}
export const getLibraryAuthorsQuery = (q: string) =>
  queryOptions({
    queryKey: keys.library.authors(q),
    queryFn: ({ signal }) => getLibraryAuthors(q, { signal }),
  })

/** GET /v1/library/tags?q&limit — existing tags; with an empty `q` the most used ones. */
export function getLibraryTags(params: { q: string; limit?: number }, opts?: RequestOptions): Promise<TagSuggestion[]> {
  return api.get<TagSuggestion[]>("/v1/library/tags", { ...opts, query: params })
}
export const getLibraryTagsQuery = (params: { q: string; limit?: number }) =>
  queryOptions({
    queryKey: keys.library.tags(params.q, params.limit),
    queryFn: ({ signal }) => getLibraryTags(params, { signal }),
  })

/** GET /v1/library/topics?subject_id — the topic tree of a subject. */
export function getLibraryTopics(params?: { subject_id?: string }, opts?: RequestOptions): Promise<Topic[]> {
  return api.get<Topic[]>("/v1/library/topics", { ...opts, query: params })
}
export const getLibraryTopicsQuery = (params?: { subject_id?: string }) =>
  queryOptions({
    queryKey: keys.library.topics(params?.subject_id),
    queryFn: ({ signal }) => getLibraryTopics(params, { signal }),
  })

/** GET /v1/library/collections — *anon*. */
export function getLibraryCollections(opts?: RequestOptions): Promise<Collection[]> {
  return api.get<Collection[]>("/v1/library/collections", opts)
}
export const getLibraryCollectionsQuery = () =>
  queryOptions({ queryKey: keys.library.collections(), queryFn: ({ signal }) => getLibraryCollections({ signal }) })

/** GET /v1/library/collections/{id} — *anon*. */
export function getLibraryCollection(id: string, opts?: RequestOptions): Promise<CollectionDetail> {
  return api.get<CollectionDetail>(`/v1/library/collections/${seg(id)}`, opts)
}
export const getLibraryCollectionQuery = (id: string) =>
  queryOptions({
    queryKey: keys.library.collection(id),
    queryFn: ({ signal }) => getLibraryCollection(id, { signal }),
  })

// - - - Reading lists - - -

/** GET /v1/library/reading-lists?subject_id&mine&group_id&status — students: lists of their groups. */
export function getReadingLists(params?: ReadingListsParams, opts?: RequestOptions): Promise<ReadingListCard[]> {
  return api.get<ReadingListCard[]>("/v1/library/reading-lists", { ...opts, query: params })
}
export const getReadingListsQuery = (params?: ReadingListsParams) =>
  queryOptions({
    queryKey: keys.library.readingLists(params),
    queryFn: ({ signal }) => getReadingLists(params, { signal }),
  })

/** GET /v1/library/reading-lists/{id} — entries with cards and my read status. */
export function getReadingList(id: string, opts?: RequestOptions): Promise<ReadingListDetail> {
  return api.get<ReadingListDetail>(`/v1/library/reading-lists/${seg(id)}`, opts)
}
export const getReadingListQuery = (id: string) =>
  queryOptions({
    queryKey: keys.library.readingList(id),
    queryFn: ({ signal }) => getReadingList(id, { signal }),
  })

/** POST /v1/library/reading-lists — teachers (own subjects) and librarians; `201`. */
export function postReadingList(body: ReadingListInput, opts?: RequestOptions): Promise<ReadingListDetail> {
  return api.post<ReadingListDetail>("/v1/library/reading-lists", body, opts)
}

/** PATCH /v1/library/reading-lists/{id}. */
export function patchReadingList(
  id: string,
  body: Partial<ReadingListInput>,
  opts?: RequestOptions,
): Promise<ReadingListDetail> {
  return api.patch<ReadingListDetail>(`/v1/library/reading-lists/${seg(id)}`, body, opts)
}

/** DELETE /v1/library/reading-lists/{id} — `204`. */
export function deleteReadingList(id: string, opts?: RequestOptions): Promise<NoContent> {
  return api.delete<NoContent>(`/v1/library/reading-lists/${seg(id)}`, opts)
}

/** PUT /v1/library/reading-lists/{id}/items — replaces the entries (at most 100, else `422 library/list-too-long`). */
export function putReadingListItems(
  id: string,
  body: { items: ReadingListItemInput[] },
  opts?: RequestOptions,
): Promise<ReadingListDetail> {
  return api.put<ReadingListDetail>(`/v1/library/reading-lists/${seg(id)}/items`, body, opts)
}

// - - - UniLibrary (server-side only; link-only records) - - -

/** GET /v1/library/external/unilibrary/search — not stored; `stale` when the cache answered because of a failure. */
export function getUniLibrarySearch(
  params?: UniLibrarySearchParams,
  opts?: RequestOptions,
): Promise<UniLibrarySearchResult> {
  return api.get<UniLibrarySearchResult>("/v1/library/external/unilibrary/search", { ...opts, query: params })
}
export const getUniLibrarySearchQuery = (params?: UniLibrarySearchParams) =>
  queryOptions({
    queryKey: keys.library.unilibrary.search(params),
    queryFn: ({ signal }) => getUniLibrarySearch(params, { signal }),
  })

/** GET /v1/library/external/unilibrary/{external_id}?category=1 — a card, not stored. */
export function getUniLibraryRecord(
  externalId: string,
  params?: { category?: number },
  opts?: RequestOptions,
): Promise<ItemCard> {
  return api.get<ItemCard>(`/v1/library/external/unilibrary/${seg(externalId)}`, { ...opts, query: params })
}

/** POST /v1/library/external/unilibrary/{external_id}/item — idempotent; stores the snapshot, the card gets an `id`. */
export function postUniLibraryPin(externalId: string, body: PinExternalBody, opts?: RequestOptions): Promise<ItemCard> {
  return api.post<ItemCard>(`/v1/library/external/unilibrary/${seg(externalId)}/item`, body, opts)
}

/** GET /v1/library/external/unilibrary/taxonomies — cached on the server. */
export function getUniLibraryTaxonomies(opts?: RequestOptions): Promise<UniLibraryTaxonomy> {
  return api.get<UniLibraryTaxonomy>("/v1/library/external/unilibrary/taxonomies", opts)
}
export const getUniLibraryTaxonomiesQuery = () =>
  queryOptions({
    queryKey: keys.library.unilibrary.taxonomies(),
    queryFn: ({ signal }) => getUniLibraryTaxonomies({ signal }),
  })

// - - - My library: shelf, progress, annotations - - -

/** GET /v1/me/library — continue reading, shelf counts and the offline limits. */
export function getMeLibrary(opts?: RequestOptions): Promise<MeLibrary> {
  return api.get<MeLibrary>("/v1/me/library", opts)
}
export const getMeLibraryQuery = () =>
  queryOptions({ queryKey: keys.library.me(), queryFn: ({ signal }) => getMeLibrary({ signal }) })

/** GET /v1/me/library/shelf?state&cursor. */
export function getShelf(params?: ShelfParams, opts?: RequestOptions): Promise<Page<ShelfEntry>> {
  return api.get<Page<ShelfEntry>>("/v1/me/library/shelf", { ...opts, query: params })
}
export const getShelfQuery = (params?: ShelfParams) =>
  queryOptions({ queryKey: keys.library.shelf(params), queryFn: ({ signal }) => getShelf(params, { signal }) })

/** PUT /v1/me/library/shelf/{item_id} — UniLibrary records can be on the shelf (pin them first). */
export function putShelfEntry(itemId: string, body: { state: ShelfState }, opts?: RequestOptions): Promise<ShelfEntry> {
  return api.put<ShelfEntry>(`/v1/me/library/shelf/${seg(itemId)}`, body, opts)
}

/** DELETE /v1/me/library/shelf/{item_id} — `204`. */
export function deleteShelfEntry(itemId: string, opts?: RequestOptions): Promise<NoContent> {
  return api.delete<NoContent>(`/v1/me/library/shelf/${seg(itemId)}`, opts)
}

/** PUT /v1/me/library/progress/{item_id} — `204`; `409 library/not-supported` for external items. */
export function putLibraryProgress(itemId: string, body: ProgressBody, opts?: RequestOptions): Promise<NoContent> {
  return api.put<NoContent>(`/v1/me/library/progress/${seg(itemId)}`, body, opts)
}

/** GET /v1/me/library/annotations?item_id&kind&color&q&cursor — private to the owner. */
export function getAnnotations(params?: AnnotationsParams, opts?: RequestOptions): Promise<Page<Annotation>> {
  return api.get<Page<Annotation>>("/v1/me/library/annotations", { ...opts, query: params })
}
export const getAnnotationsQuery = (params?: AnnotationsParams) =>
  queryOptions({
    queryKey: keys.library.annotations(params),
    queryFn: ({ signal }) => getAnnotations(params, { signal }),
  })

/** POST /v1/me/library/annotations — `201`, idempotent by `client_id`. */
export function postAnnotation(body: AnnotationInput, opts?: RequestOptions): Promise<Annotation> {
  return api.post<Annotation>("/v1/me/library/annotations", body, opts)
}

/** POST /v1/me/library/annotations/sync — at most 200 changes; the server de-duplicates by `client_id`. */
export function postAnnotationsSync(
  body: AnnotationsSyncBody,
  opts?: RequestOptions,
): Promise<{ items: Annotation[] }> {
  return api.post<{ items: Annotation[] }>("/v1/me/library/annotations/sync", body, opts)
}

/** PATCH /v1/me/library/annotations/{id}. */
export function patchAnnotation(id: string, body: AnnotationPatchBody, opts?: RequestOptions): Promise<Annotation> {
  return api.patch<Annotation>(`/v1/me/library/annotations/${seg(id)}`, body, opts)
}

/** DELETE /v1/me/library/annotations/{id} — `204`. */
export function deleteAnnotation(id: string, opts?: RequestOptions): Promise<NoContent> {
  return api.delete<NoContent>(`/v1/me/library/annotations/${seg(id)}`, opts)
}

/** GET /v1/me/library/annotations/export?item_id — Markdown text. */
export function getAnnotationsExport(params?: { item_id?: string }, opts?: RequestOptions): Promise<string> {
  return api.get<string>("/v1/me/library/annotations/export", { ...opts, query: params, responseType: "text" })
}

// - - - Uploading materials, suggestions, reports - - -

/** GET /v1/library/my-groups — teachers, librarians and Administration (students: `403`). */
export function getLibraryMyGroups(opts?: RequestOptions): Promise<LibraryGroup[]> {
  return api.get<LibraryGroup[]>("/v1/library/my-groups", opts)
}
export const getLibraryMyGroupsQuery = () =>
  queryOptions({ queryKey: keys.library.myGroups(), queryFn: ({ signal }) => getLibraryMyGroups({ signal }) })

/** POST /v1/library/materials — `201`, a `draft`; `attested: false` saves it before the attestation is ticked. */
export function postMaterial(body: MaterialInput, opts?: RequestOptions): Promise<ItemDetail> {
  return api.post<ItemDetail>("/v1/library/materials", body, opts)
}

/** POST /v1/library/materials/{id}/files — one PDF, or images (combined into a PDF), uploaded with `library_material`. */
export function postMaterialFiles(id: string, body: MaterialFilesBody, opts?: RequestOptions): Promise<ItemDetail> {
  return api.post<ItemDetail>(`/v1/library/materials/${seg(id)}/files`, body, opts)
}

/**
 * POST /v1/library/materials/{id}/submit — `202`: `pending_review`, or `published` for a teacher.
 * `422 library/attestation-required` until the draft is attested.
 */
export function postMaterialSubmit(id: string, opts?: RequestOptions): Promise<ItemDetail> {
  return api.post<ItemDetail>(`/v1/library/materials/${seg(id)}/submit`, undefined, opts)
}

/** PATCH /v1/library/materials/{id} (also `{ attested }` of a draft or a material with changes requested). */
export function patchMaterial(id: string, body: MaterialPatchBody, opts?: RequestOptions): Promise<ItemDetail> {
  return api.patch<ItemDetail>(`/v1/library/materials/${seg(id)}`, body, opts)
}

/** POST /v1/library/materials/{id}/versions — `201`, a new version that supersedes this one once approved. */
export function postMaterialVersion(id: string, body: MaterialInput, opts?: RequestOptions): Promise<ItemDetail> {
  return api.post<ItemDetail>(`/v1/library/materials/${seg(id)}/versions`, body, opts)
}

/** DELETE /v1/library/materials/{id} — withdraws the item (`204`). */
export function deleteMaterial(id: string, opts?: RequestOptions): Promise<NoContent> {
  return api.delete<NoContent>(`/v1/library/materials/${seg(id)}`, opts)
}

/** GET /v1/me/library/uploads?status — status, reason and queue position of my materials. */
export function getMyUploads(params?: UploadsParams, opts?: RequestOptions): Promise<Page<UploadRow>> {
  return api.get<Page<UploadRow>>("/v1/me/library/uploads", { ...opts, query: params })
}
export const getMyUploadsQuery = (params?: UploadsParams) =>
  queryOptions({
    queryKey: keys.library.uploads(params),
    queryFn: ({ signal }) => getMyUploads(params, { signal }),
  })

/** POST /v1/library/suggestions — `201`; lands in the librarian queue. */
export function postSuggestion(body: SuggestionBody, opts?: RequestOptions): Promise<NoContent> {
  return api.post<NoContent>("/v1/library/suggestions", body, opts)
}

/** POST /v1/library/items/{id}/report — `204`. */
export function postItemReport(id: string, body: LibraryReportBody, opts?: RequestOptions): Promise<NoContent> {
  return api.post<NoContent>(`/v1/library/items/${seg(id)}/report`, body, opts)
}

// - - - Librarian area (role librarian or admin) - - -

/** GET /v1/manage/library/queue?tab&cursor. */
export function getManageQueue(params: QueueParams, opts?: RequestOptions): Promise<Page<ManageQueueRow>> {
  return api.get<Page<ManageQueueRow>>("/v1/manage/library/queue", { ...opts, query: params })
}
export const getManageQueueQuery = (params: QueueParams) =>
  queryOptions({
    queryKey: keys.library.manage.queue(params),
    queryFn: ({ signal }) => getManageQueue(params, { signal }),
  })

/** POST /v1/manage/library/items/{id}/{action} — a reason is required except for `approve`; `403 library/own-item`. */
export function postModeration(
  id: string,
  action: ModerationAction,
  body?: ModerationBody,
  opts?: RequestOptions,
): Promise<ItemDetail> {
  return api.post<ItemDetail>(`/v1/manage/library/items/${seg(id)}/${seg(action)}`, body ?? {}, opts)
}

/** POST /v1/manage/library/reports/{id}/resolve — `204`. */
export function postReportResolve(id: string, body: ReportResolveBody, opts?: RequestOptions): Promise<NoContent> {
  return api.post<NoContent>(`/v1/manage/library/reports/${seg(id)}/resolve`, body, opts)
}

/** GET /v1/manage/library/books?q&status&cursor — books table (not in the document's § 7.2; see the report). */
export function getManageBooks(params?: BookRowsParams, opts?: RequestOptions): Promise<Page<BookRow>> {
  return api.get<Page<BookRow>>("/v1/manage/library/books", { ...opts, query: params })
}
export const getManageBooksQuery = (params?: BookRowsParams) =>
  queryOptions({
    queryKey: keys.library.manage.books(params),
    queryFn: ({ signal }) => getManageBooks(params, { signal }),
  })

/** GET /v1/manage/library/books/{id} — the editor's data: input, detail and the publish checklist (not in § 7.2). */
export function getManageBook(id: string, opts?: RequestOptions): Promise<BookDraft> {
  return api.get<BookDraft>(`/v1/manage/library/books/${seg(id)}`, opts)
}
export const getManageBookQuery = (id: string) =>
  queryOptions({
    queryKey: keys.library.manage.book(id),
    queryFn: ({ signal }) => getManageBook(id, { signal }),
  })

/** POST /v1/manage/library/books — a draft book. */
export function postManageBook(body: BookInput, opts?: RequestOptions): Promise<ItemDetail> {
  return api.post<ItemDetail>("/v1/manage/library/books", body, opts)
}

/** PATCH /v1/manage/library/books/{id}. */
export function patchManageBook(id: string, body: Partial<BookInput>, opts?: RequestOptions): Promise<ItemDetail> {
  return api.patch<ItemDetail>(`/v1/manage/library/books/${seg(id)}`, body, opts)
}

/** POST /v1/manage/library/books/{id}/{publish|unpublish|takedown} — publish answers `422 library/rights-incomplete`. */
export function postManageBookAction(
  id: string,
  action: BookAction,
  body?: BookActionBody,
  opts?: RequestOptions,
): Promise<ItemDetail> {
  return api.post<ItemDetail>(`/v1/manage/library/books/${seg(id)}/${seg(action)}`, body ?? {}, opts)
}

/** POST /v1/manage/library/books/{id}/files — attaches an uploaded file. */
export function postManageBookFile(id: string, body: BookFileBody, opts?: RequestOptions): Promise<ItemFile> {
  return api.post<ItemFile>(`/v1/manage/library/books/${seg(id)}/files`, body, opts)
}

/** POST /v1/manage/library/import — CSV bulk import; good rows become drafts. */
export function postManageImport(body: ImportBody, opts?: RequestOptions): Promise<ImportResult> {
  return api.post<ImportResult>("/v1/manage/library/import", body, opts)
}

/** GET /v1/manage/library/topics?subject_id. */
export function getManageTopics(params?: { subject_id?: string }, opts?: RequestOptions): Promise<ManageTopic[]> {
  return api.get<ManageTopic[]>("/v1/manage/library/topics", { ...opts, query: params })
}
export const getManageTopicsQuery = (params?: { subject_id?: string }) =>
  queryOptions({
    queryKey: keys.library.manage.topics(params?.subject_id),
    queryFn: ({ signal }) => getManageTopics(params, { signal }),
  })

export function postManageTopic(body: TopicInput, opts?: RequestOptions): Promise<ManageTopic> {
  return api.post<ManageTopic>("/v1/manage/library/topics", body, opts)
}
export function patchManageTopic(id: string, body: TopicPatch, opts?: RequestOptions): Promise<ManageTopic> {
  return api.patch<ManageTopic>(`/v1/manage/library/topics/${seg(id)}`, body, opts)
}
export function deleteManageTopic(id: string, opts?: RequestOptions): Promise<NoContent> {
  return api.delete<NoContent>(`/v1/manage/library/topics/${seg(id)}`, opts)
}

/** GET /v1/manage/library/subjects — the whole subject tree, archived ones included. */
export function getManageSubjects(opts?: RequestOptions): Promise<ManageSubject[]> {
  return api.get<ManageSubject[]>("/v1/manage/library/subjects", opts)
}
export const getManageSubjectsQuery = () =>
  queryOptions({
    queryKey: keys.library.manage.subjects(),
    queryFn: ({ signal }) => getManageSubjects({ signal }),
  })
export function postManageSubject(body: SubjectInput, opts?: RequestOptions): Promise<ManageSubject> {
  return api.post<ManageSubject>("/v1/manage/library/subjects", body, opts)
}
export function patchManageSubject(id: string, body: SubjectPatch, opts?: RequestOptions): Promise<ManageSubject> {
  return api.patch<ManageSubject>(`/v1/manage/library/subjects/${seg(id)}`, body, opts)
}
export function deleteManageSubject(id: string, opts?: RequestOptions): Promise<NoContent> {
  return api.delete<NoContent>(`/v1/manage/library/subjects/${seg(id)}`, opts)
}

/** GET /v1/manage/library/suggestions/{id} — a student's suggestion with the book form they filled in. */
export function getManageSuggestion(id: string, opts?: RequestOptions): Promise<SuggestionDetail> {
  return api.get<SuggestionDetail>(`/v1/manage/library/suggestions/${seg(id)}`, opts)
}
export const getManageSuggestionQuery = (id: string) =>
  queryOptions({
    queryKey: keys.library.manage.suggestion(id),
    queryFn: ({ signal }) => getManageSuggestion(id, { signal }),
  })

/** GET /v1/manage/library/collections. */
export function getManageCollections(opts?: RequestOptions): Promise<ManageCollection[]> {
  return api.get<ManageCollection[]>("/v1/manage/library/collections", opts)
}
export const getManageCollectionsQuery = () =>
  queryOptions({
    queryKey: keys.library.manage.collections(),
    queryFn: ({ signal }) => getManageCollections({ signal }),
  })

export function postManageCollection(body: CollectionInput, opts?: RequestOptions): Promise<ManageCollection> {
  return api.post<ManageCollection>("/v1/manage/library/collections", body, opts)
}
export function patchManageCollection(
  id: string,
  body: Partial<CollectionInput>,
  opts?: RequestOptions,
): Promise<ManageCollection> {
  return api.patch<ManageCollection>(`/v1/manage/library/collections/${seg(id)}`, body, opts)
}
export function deleteManageCollection(id: string, opts?: RequestOptions): Promise<NoContent> {
  return api.delete<NoContent>(`/v1/manage/library/collections/${seg(id)}`, opts)
}

/** GET /v1/manage/library/stats?from&to. */
export function getManageStats(params?: { from?: string; to?: string }, opts?: RequestOptions): Promise<LibraryStats> {
  return api.get<LibraryStats>("/v1/manage/library/stats", { ...opts, query: params })
}
export const getManageStatsQuery = (params?: { from?: string; to?: string }) =>
  queryOptions({
    queryKey: keys.library.manage.stats(params),
    queryFn: ({ signal }) => getManageStats(params, { signal }),
  })

// - - - Administration - - -

/** GET /v1/admin/library/sanctions?user_id. */
export function getLibrarySanctions(params?: { user_id?: string }, opts?: RequestOptions): Promise<Sanction[]> {
  return api.get<Sanction[]>("/v1/admin/library/sanctions", { ...opts, query: params })
}

/** POST /v1/admin/library/sanctions — warn or ban a user from uploading. */
export function postLibrarySanction(body: SanctionBody, opts?: RequestOptions): Promise<Sanction> {
  return api.post<Sanction>("/v1/admin/library/sanctions", body, opts)
}

/** GET /v1/admin/library/unilibrary/settings. */
export function getUniLibrarySettings(opts?: RequestOptions): Promise<UniLibrarySettings> {
  return api.get<UniLibrarySettings>("/v1/admin/library/unilibrary/settings", opts)
}
export const getUniLibrarySettingsQuery = () =>
  queryOptions({
    queryKey: keys.library.admin.settings(),
    queryFn: ({ signal }) => getUniLibrarySettings({ signal }),
  })

/** PUT /v1/admin/library/unilibrary/settings. */
export function putUniLibrarySettings(body: UniLibrarySettings, opts?: RequestOptions): Promise<UniLibrarySettings> {
  return api.put<UniLibrarySettings>("/v1/admin/library/unilibrary/settings", body, opts)
}

/** GET /v1/admin/library/unilibrary/feeds. */
export function getUniLibraryFeeds(opts?: RequestOptions): Promise<Feed[]> {
  return api.get<Feed[]>("/v1/admin/library/unilibrary/feeds", opts)
}
export const getUniLibraryFeedsQuery = () =>
  queryOptions({ queryKey: keys.library.admin.feeds(), queryFn: ({ signal }) => getUniLibraryFeeds({ signal }) })

export function postUniLibraryFeed(body: FeedInput, opts?: RequestOptions): Promise<Feed> {
  return api.post<Feed>("/v1/admin/library/unilibrary/feeds", body, opts)
}
export function patchUniLibraryFeed(id: string, body: Partial<FeedInput>, opts?: RequestOptions): Promise<Feed> {
  return api.patch<Feed>(`/v1/admin/library/unilibrary/feeds/${seg(id)}`, body, opts)
}
export function deleteUniLibraryFeed(id: string, opts?: RequestOptions): Promise<NoContent> {
  return api.delete<NoContent>(`/v1/admin/library/unilibrary/feeds/${seg(id)}`, opts)
}

/** POST /v1/admin/library/unilibrary/feeds/{id}/{dry-run|run|enable|disable}. */
export function postUniLibraryFeedAction(id: string, action: FeedAction, opts?: RequestOptions): Promise<Feed> {
  return api.post<Feed>(`/v1/admin/library/unilibrary/feeds/${seg(id)}/${seg(action)}`, undefined, opts)
}

/** GET /v1/admin/library/unilibrary/field-map. */
export function getUniLibraryFieldMap(opts?: RequestOptions): Promise<FieldMapEntry[]> {
  return api.get<FieldMapEntry[]>("/v1/admin/library/unilibrary/field-map", opts)
}
export const getUniLibraryFieldMapQuery = () =>
  queryOptions({
    queryKey: keys.library.admin.fieldMap(),
    queryFn: ({ signal }) => getUniLibraryFieldMap({ signal }),
  })

/** PUT /v1/admin/library/unilibrary/field-map. */
export function putUniLibraryFieldMap(body: FieldMapEntry[], opts?: RequestOptions): Promise<FieldMapEntry[]> {
  return api.put<FieldMapEntry[]>("/v1/admin/library/unilibrary/field-map", body, opts)
}

/** GET /v1/admin/library/unilibrary/status — breaker state, last calls, cache stats, hidden records. */
export function getUniLibraryStatus(opts?: RequestOptions): Promise<UniLibraryStatus> {
  return api.get<UniLibraryStatus>("/v1/admin/library/unilibrary/status", opts)
}
export const getUniLibraryStatusQuery = () =>
  queryOptions({
    queryKey: keys.library.admin.status(),
    queryFn: ({ signal }) => getUniLibraryStatus({ signal }),
  })
