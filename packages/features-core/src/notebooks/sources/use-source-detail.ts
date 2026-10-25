"use client"

import { getNotebookSourceQuery } from "@ihsp/api"
import { useQuery } from "@tanstack/react-query"
import { hasGuideKind } from "./source-rules"

const READING_POLL_MS = 2000
const GUIDE_POLL_MS = 3000
const GUIDE_POLL_LIMIT = 15

/**
 * One source with its guide and note body. Unlike `useSource`, it also polls while the source is still being read, so
 * a viewer opened right after "Add" turns into the text by itself; it then waits a few polls for the guide.
 */
export function useSourceDetail(notebookId: string, sourceId: string | null) {
  return useQuery({
    ...getNotebookSourceQuery(notebookId, sourceId ?? ""),
    enabled: sourceId !== null && sourceId !== "",
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data) return false
      if (data.status === "pending" || data.status === "processing") return READING_POLL_MS
      const waitingForGuide = data.status === "ready" && data.guide === null && hasGuideKind(data.kind)
      return waitingForGuide && query.state.dataUpdateCount < GUIDE_POLL_LIMIT ? GUIDE_POLL_MS : false
    },
  })
}
