"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useSyncExternalStore } from "react"
import { isPersistedQueryKey } from "../utils/persisted-queries"

/** The newest `dataUpdatedAt` among the offline pages' queries (today, timetable, homework, grades); `null` without data. */
export function newestCachedAt(
  queries: { queryKey: readonly unknown[]; state: { dataUpdatedAt: number } }[],
): number | null {
  let newest = 0
  for (const query of queries) {
    if (isPersistedQueryKey(query.queryKey) && query.state.dataUpdatedAt > newest) newest = query.state.dataUpdatedAt
  }
  return newest === 0 ? null : newest
}

/** When the data shown offline was last fetched (ms since the epoch), or `null` while nothing is cached. */
export function useCachedDataAge(): number | null {
  const queryClient = useQueryClient()
  const cache = queryClient.getQueryCache()
  const subscribe = useCallback((onChange: () => void) => cache.subscribe(onChange), [cache])
  return useSyncExternalStore(
    subscribe,
    () => newestCachedAt(cache.getAll()),
    () => null,
  )
}
