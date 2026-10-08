"use client"

import { useSession } from "@ihsp/auth"
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister"
import { IsRestoringProvider, useQueryClient } from "@tanstack/react-query"
import { persistQueryClientRestore, persistQueryClientSubscribe } from "@tanstack/react-query-persist-client"
import { useEffect, useState, type ReactNode } from "react"
import {
  PERSISTED_KEY_PREFIXES,
  PERSIST_MAX_AGE_MS,
  PERSIST_STORAGE_KEY,
  isPersistedQueryKey,
} from "../utils/persisted-queries"

function createPersister() {
  try {
    return createSyncStoragePersister({ storage: window.localStorage, key: PERSIST_STORAGE_KEY, throttleTime: 1000 })
  } catch {
    return null
  }
}

/**
 * Keeps the last answers of Today, Timetable, Homework and Grades in `localStorage` for 24 hours (WEB-30).
 * They are restored before the first request, so a page opened offline still shows the last data. The stored cache
 * belongs to one user: another account (or a logout) discards it.
 */
export function QueryPersistence({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const { session } = useSession()
  const userId = session?.user.id ?? null
  const [restoring, setRestoring] = useState(true)

  useEffect(() => {
    if (!userId) return
    const persister = createPersister()
    if (!persister) {
      setRestoring(false)
      return
    }
    for (const prefix of PERSISTED_KEY_PREFIXES) {
      queryClient.setQueryDefaults([...prefix], { gcTime: PERSIST_MAX_AGE_MS })
    }
    let unsubscribe: (() => void) | undefined
    let cancelled = false
    persistQueryClientRestore({ queryClient, persister, maxAge: PERSIST_MAX_AGE_MS, buster: userId })
      // The stored answers are shown at once but treated as stale: the stored copy can lag a second behind a change
      // the user just made (the write is throttled), so every page asks the server again; offline, the old answer stays.
      .then(() => queryClient.invalidateQueries({ predicate: (query) => isPersistedQueryKey(query.queryKey) }))
      .catch(() => undefined)
      .finally(() => {
        if (cancelled) return
        unsubscribe = persistQueryClientSubscribe({
          queryClient,
          persister,
          buster: userId,
          dehydrateOptions: {
            shouldDehydrateQuery: (query) => query.state.status === "success" && isPersistedQueryKey(query.queryKey),
          },
        })
        setRestoring(false)
      })
    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [queryClient, userId])

  return <IsRestoringProvider value={restoring}>{children}</IsRestoringProvider>
}
