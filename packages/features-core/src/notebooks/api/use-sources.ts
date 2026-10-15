"use client"

import {
  deleteNotebookSource,
  getNotebookSourceQuery,
  getNotebookSourcesQuery,
  getPassageQuery,
  getSourcePassages,
  keys,
  patchNotebookAuto,
  patchNotebookSource,
  postNotebookSourceSync,
  postNotebookSources,
  postNotebookSourcesSelect,
  type AddSourcesResult,
  type NotebookDetail,
  type SourceInput,
  type SourceItem,
  type SourcePatchBody,
} from "@ihsp/api"
import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query"
import { hasPendingSources, isUsable } from "../lib/sort-sources"

const POLL_MS = 2000

/** The sources of a notebook; polls every 2 s while any is `pending` or `processing`, then stops. */
export function useSources(notebookId: string) {
  return useQuery({
    ...getNotebookSourcesQuery(notebookId),
    refetchInterval: (query) => (hasPendingSources(query.state.data) ? POLL_MS : false),
  })
}

/** One source with its guide. A ready source without a guide is polled a few times while the guide is built. */
export function useSource(notebookId: string, sourceId: string | null) {
  return useQuery({
    ...getNotebookSourceQuery(notebookId, sourceId ?? ""),
    enabled: sourceId !== null && sourceId !== "",
    refetchInterval: (query) => {
      const data = query.state.data
      const waitingForGuide =
        data && data.status === "ready" && !data.has_guide && data.kind !== "text" && data.kind !== "note"
      return waitingForGuide && query.state.dataUpdateCount < 15 ? 3000 : false
    },
  })
}

const PASSAGE_PAGE_SIZE = 60

/** The text of a source, 60 passages per page (infinite scroll). */
export function useSourcePassages(notebookId: string, sourceId: string | null) {
  return useInfiniteQuery({
    queryKey: keys.notebooks.passages(notebookId, sourceId ?? ""),
    queryFn: ({ pageParam, signal }) =>
      getSourcePassages(
        notebookId,
        sourceId ?? "",
        { cursor: pageParam || undefined, limit: PASSAGE_PAGE_SIZE },
        { signal },
      ),
    initialPageParam: "",
    getNextPageParam: (last) => last.next_cursor ?? undefined,
    enabled: sourceId !== null && sourceId !== "",
  })
}

/** One passage with its neighbours (the quote behind a citation chip). */
export function usePassage(notebookId: string, passageId: string | null, context = 2) {
  return useQuery({
    ...getPassageQuery(notebookId, passageId ?? "", { context }),
    enabled: passageId !== null && passageId !== "",
    retry: false,
  })
}

function setSourcesCache(queryClient: QueryClient, notebookId: string, update: (items: SourceItem[]) => SourceItem[]) {
  queryClient.setQueryData<SourceItem[]>(keys.notebooks.sources(notebookId), (current) =>
    current ? update(current) : current,
  )
}

/** Source counts live on the notebook (`source_count`, `selected_source_count`): refresh it after source changes. */
function refreshNotebook(queryClient: QueryClient, notebookId: string) {
  return queryClient.invalidateQueries({ queryKey: keys.notebooks.detail(notebookId) })
}

export function useAddSources(notebookId: string) {
  const queryClient = useQueryClient()
  return useMutation<AddSourcesResult, unknown, SourceInput[]>({
    mutationFn: (items) => postNotebookSources(notebookId, { items }),
    onSuccess: (result) => {
      setSourcesCache(queryClient, notebookId, (current) => [...current, ...result.items])
      void queryClient.invalidateQueries({ queryKey: keys.notebooks.sources(notebookId) })
      void refreshNotebook(queryClient, notebookId)
    },
  })
}

type Rollback = { previous: SourceItem[] | undefined }

function optimisticSelect(
  queryClient: QueryClient,
  notebookId: string,
  ids: string[] | null,
  selected: boolean,
): Rollback {
  const previous = queryClient.getQueryData<SourceItem[]>(keys.notebooks.sources(notebookId))
  setSourcesCache(queryClient, notebookId, (items) =>
    items.map((item) => (isUsable(item) && (ids === null || ids.includes(item.id)) ? { ...item, selected } : item)),
  )
  queryClient.setQueryData<NotebookDetail>(keys.notebooks.detail(notebookId), (current) => {
    const items = queryClient.getQueryData<SourceItem[]>(keys.notebooks.sources(notebookId))
    return current && items
      ? { ...current, selected_source_count: items.filter((item) => isUsable(item) && item.selected).length }
      : current
  })
  return { previous }
}

/** Checkbox of one source. Optimistic; rolls back on error. */
export function useSelectSource(notebookId: string) {
  const queryClient = useQueryClient()
  return useMutation<SourceItem, unknown, { id: string; selected: boolean }, Rollback>({
    mutationFn: ({ id, selected }) => patchNotebookSource(notebookId, id, { selected }),
    onMutate: async ({ id, selected }) => {
      await queryClient.cancelQueries({ queryKey: keys.notebooks.sources(notebookId) })
      return optimisticSelect(queryClient, notebookId, [id], selected)
    },
    onError: (_error, _input, context) => {
      queryClient.setQueryData(keys.notebooks.sources(notebookId), context?.previous)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: keys.notebooks.sources(notebookId) })
      void refreshNotebook(queryClient, notebookId)
    },
  })
}

/** "Select all" and group checkboxes: `ids` absent means every source. Optimistic; rolls back on error. */
export function useSelectSources(notebookId: string) {
  const queryClient = useQueryClient()
  return useMutation<SourceItem[], unknown, { selected: boolean; ids?: string[] }, Rollback>({
    mutationFn: (body) => postNotebookSourcesSelect(notebookId, body),
    onMutate: async ({ selected, ids }) => {
      await queryClient.cancelQueries({ queryKey: keys.notebooks.sources(notebookId) })
      return optimisticSelect(queryClient, notebookId, ids ?? null, selected)
    },
    onError: (_error, _input, context) => {
      queryClient.setQueryData(keys.notebooks.sources(notebookId), context?.previous)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: keys.notebooks.sources(notebookId) })
      void refreshNotebook(queryClient, notebookId)
    },
  })
}

/** Rename, or edit the body of a pasted text or note (`body_md`). */
export function useUpdateSource(notebookId: string) {
  const queryClient = useQueryClient()
  return useMutation<SourceItem, unknown, { id: string; body: SourcePatchBody }>({
    mutationFn: ({ id, body }) => patchNotebookSource(notebookId, id, body),
    onSuccess: (item) => {
      setSourcesCache(queryClient, notebookId, (items) =>
        items.map((current) => (current.id === item.id ? item : current)),
      )
      void queryClient.invalidateQueries({ queryKey: keys.notebooks.source(notebookId, item.id) })
      void queryClient.invalidateQueries({ queryKey: keys.notebooks.passages(notebookId, item.id) })
    },
  })
}

export function useSyncSource(notebookId: string) {
  const queryClient = useQueryClient()
  return useMutation<SourceItem, unknown, string>({
    mutationFn: (id) => postNotebookSourceSync(notebookId, id),
    onSuccess: (item) => {
      setSourcesCache(queryClient, notebookId, (items) =>
        items.map((current) => (current.id === item.id ? item : current)),
      )
    },
  })
}

export function useRemoveSource(notebookId: string) {
  const queryClient = useQueryClient()
  return useMutation<unknown, unknown, string>({
    mutationFn: (id) => deleteNotebookSource(notebookId, id),
    onSuccess: (_result, id) => {
      setSourcesCache(queryClient, notebookId, (items) => items.filter((item) => item.id !== id))
      queryClient.removeQueries({ queryKey: keys.notebooks.source(notebookId, id) })
      void refreshNotebook(queryClient, notebookId)
    },
  })
}

/**
 * Excludes a synced source of a subject or lesson notebook (`PATCH …/auto`): it leaves now and the sync keeps it out
 * until it is restored. Own sources are removed instead.
 */
export function useExcludeSource(notebookId: string) {
  const queryClient = useQueryClient()
  return useMutation<NotebookDetail, unknown, string>({
    mutationFn: (id) => patchNotebookAuto(notebookId, { exclude_source_ids: [id] }),
    onSuccess: (detail, id) => {
      setSourcesCache(queryClient, notebookId, (items) => items.filter((item) => item.id !== id))
      queryClient.removeQueries({ queryKey: keys.notebooks.source(notebookId, id) })
      queryClient.setQueryData(keys.notebooks.detail(notebookId), detail)
    },
  })
}
