"use client"

import {
  deleteNotebook,
  getNotebookQuery,
  getNotebooks,
  getNotebooksQuery,
  keys,
  patchNotebook,
  postNotebook,
  type NotebookCreateBody,
  type NotebookDetail,
  type NotebookItem,
  type NotebookPatchBody,
  type Page,
} from "@ihsp/api"
import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"
import { createSummaryPoll } from "../lib/summary-poll"

/** The student's notebooks, pinned first (`q` filters by title on the server). */
export function useNotebooks(q?: string, enabled = true) {
  return useQuery({ ...getNotebooksQuery({ q: q?.trim() || undefined, limit: 100 }), enabled })
}

const PAGE_LIMIT = 100

/**
 * Every notebook the student has (`q` filters by title on the server), fetched page by page until the server has no
 * more, so counts and the folder lists stay correct past one page. Kept apart from `useNotebooks`' list cache, so
 * optimistic updates on a single page never see the paged shape.
 */
export function useAllNotebooks(q?: string, enabled = true) {
  const term = q?.trim() || undefined
  const query = useInfiniteQuery({
    queryKey: [...keys.notebooks.all(), "pages", term ?? ""] as const,
    queryFn: ({ pageParam, signal }) =>
      getNotebooks({ q: term, cursor: pageParam, limit: PAGE_LIMIT }, { signal }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.next_cursor ?? undefined,
    enabled,
  })
  const { hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage } = query
  useEffect(() => {
    // A failed page stops the walk; the caller shows the error and the list keeps what it has.
    if (enabled && hasNextPage && !isFetchingNextPage && !isFetchNextPageError) void fetchNextPage()
  }, [enabled, hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage])
  const items = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data])
  return {
    items,
    isPending: query.isPending,
    isSuccess: query.isSuccess,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    /** More pages are still arriving (the counts are not final yet). */
    loadingMore: (hasNextPage === true && !isFetchNextPageError) || isFetchingNextPage,
  }
}

/**
 * One notebook; opening it sets `last_opened_at` on the server. While the summary is `stale` or `building` (sources
 * were added or removed) the notebook is refetched every 4 s, for at most two minutes, so the summary and the
 * suggested questions appear without a reload.
 */
export function useNotebook(id: string | null) {
  const [summaryPoll] = useState(() => createSummaryPoll())
  return useQuery({
    ...getNotebookQuery(id ?? ""),
    enabled: id !== null && id !== "",
    refetchInterval: (query) => summaryPoll(id ?? "", query.state.data?.summary_status),
  })
}

/**
 * The notebook as the workspace has already loaded it. It never refetches on mount (the server marks every GET as an
 * opening), so panes can ask "is this a course workspace?" without extra requests.
 */
export function useLoadedNotebook(id: string | null) {
  return useQuery({ ...getNotebookQuery(id ?? ""), enabled: id !== null && id !== "", refetchOnMount: false })
}

function refreshLists(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: [...keys.notebooks.all(), "pages"] })
  return queryClient.invalidateQueries({ queryKey: [...keys.notebooks.all(), "list"] })
}

export function useCreateNotebook() {
  const queryClient = useQueryClient()
  return useMutation<NotebookDetail, unknown, NotebookCreateBody | undefined>({
    mutationFn: (body) => postNotebook(body),
    onSuccess: (notebook) => {
      queryClient.setQueryData(keys.notebooks.detail(notebook.id), notebook)
      void refreshLists(queryClient)
    },
  })
}

type UpdateContext = {
  previous: NotebookDetail | undefined
  lists: [readonly unknown[], Page<NotebookItem> | undefined][]
}

/** Rename, emoji, pin and chat configuration. Optimistic: the title and pin show at once and roll back on error. */
export function useUpdateNotebook(id: string) {
  const queryClient = useQueryClient()
  return useMutation<NotebookDetail, unknown, NotebookPatchBody, UpdateContext>({
    mutationFn: (body) => patchNotebook(id, body),
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey: keys.notebooks.all() })
      const previous = queryClient.getQueryData<NotebookDetail>(keys.notebooks.detail(id))
      const lists = queryClient.getQueriesData<Page<NotebookItem>>({ queryKey: [...keys.notebooks.all(), "list"] })
      const { chat_config: _config, ...itemFields } = body
      queryClient.setQueryData<NotebookDetail>(keys.notebooks.detail(id), (current) =>
        current ? { ...current, ...body } : current,
      )
      queryClient.setQueriesData<Page<NotebookItem>>({ queryKey: [...keys.notebooks.all(), "list"] }, (current) =>
        current
          ? { ...current, items: current.items.map((item) => (item.id === id ? { ...item, ...itemFields } : item)) }
          : current,
      )
      return { previous, lists }
    },
    onError: (_error, _body, context) => {
      if (!context) return
      queryClient.setQueryData(keys.notebooks.detail(id), context.previous)
      for (const [key, data] of context.lists) queryClient.setQueryData(key, data)
    },
    onSuccess: (notebook) => {
      queryClient.setQueryData(keys.notebooks.detail(id), notebook)
    },
    onSettled: () => void refreshLists(queryClient),
  })
}

export function useDeleteNotebook() {
  const queryClient = useQueryClient()
  return useMutation<unknown, unknown, string>({
    mutationFn: (id) => deleteNotebook(id),
    onSuccess: (_result, id) => {
      queryClient.removeQueries({ queryKey: keys.notebooks.detail(id) })
      void refreshLists(queryClient)
    },
  })
}
