"use client"

import type { QueueTab } from "@ihsp/api"
import { useQueries } from "@tanstack/react-query"
import { QUEUE_TABS, queueQuery } from "./queue-utils"

export type QueueCount = {
  /** `null` until the tab has loaded (or when it failed). */
  rows: number | null
  /** The page was full: show "N+". */
  hasMore: boolean
  /** Submission time of the oldest row, for the age of the tab. */
  oldest: string | null
}

/**
 * The count and the age of every tab, from the same queries the list uses. The API has no count endpoint, so the
 * first page of a tab is the count; when it is full ("more rows follow") the strip says "N+".
 */
export function useQueueCounts(): Record<QueueTab, QueueCount> {
  const results = useQueries({ queries: QUEUE_TABS.map(queueQuery) })
  const counts = {} as Record<QueueTab, QueueCount>
  QUEUE_TABS.forEach((tab, index) => {
    const page = results[index]?.data
    const dates = (page?.items ?? []).map((row) => row.submitted_at).toSorted()
    counts[tab] = { rows: page ? page.items.length : null, hasMore: !!page?.next_cursor, oldest: dates[0] ?? null }
  })
  return counts
}
