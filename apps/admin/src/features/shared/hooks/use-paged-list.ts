"use client"

import type { Page } from "@ihsp/api"
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query"
import { useMemo } from "react"

/** What the table needs from any list: the rows loaded so far and how to get more. */
export type ListSource<T> = {
  items: T[]
  isPending: boolean
  isError: boolean
  error: unknown
  refetch: () => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => void
}

/** Rows per request; the table slices these into its own (smaller) pages. */
export const SERVER_PAGE_SIZE = 100

/** A cursor-paginated endpoint (`Page<T>`). Include every filter in `queryKey`. */
export function usePagedList<T>(
  queryKey: readonly unknown[],
  fetchPage: (cursor: string | undefined, signal?: AbortSignal) => Promise<Page<T>>,
  options: { enabled?: boolean } = {},
): ListSource<T> {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam, signal }) => fetchPage(pageParam, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: Page<T>) => last.next_cursor ?? undefined,
    enabled: options.enabled ?? true,
    // Keep showing the old rows while a changed filter loads, so a search box does not lose focus.
    placeholderData: keepPreviousData,
  })
  const items = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data])
  return {
    items,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: () => void query.refetch(),
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: () => void query.fetchNextPage(),
  }
}

/** An endpoint that returns a plain array (groups, subjects, rooms, terms). */
export function useArrayList<T>(query: {
  data: T[] | undefined
  isPending: boolean
  isError: boolean
  error: unknown
  refetch: () => unknown
}): ListSource<T> {
  return {
    items: query.data ?? [],
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: () => void query.refetch(),
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: () => undefined,
  }
}
