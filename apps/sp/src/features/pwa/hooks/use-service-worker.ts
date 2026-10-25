"use client"

import { useServiceWorker as useSharedServiceWorker } from "@ihsp/features-core/pwa"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"
import { isPersistedQueryKey } from "../../offline/utils/persisted-queries"

/**
 * Registers the service worker and listens to it: when it revalidated a cached answer (today, timetable, homework,
 * grades) and the fresh one differs from what the page was given, the page asks again and shows the new data.
 */
export function useServiceWorker(): void {
  const queryClient = useQueryClient()
  const onApiUpdated = useCallback(() => {
    void queryClient.invalidateQueries({ predicate: (query) => isPersistedQueryKey(query.queryKey) })
  }, [queryClient])
  useSharedServiceWorker({ onApiUpdated })
}
