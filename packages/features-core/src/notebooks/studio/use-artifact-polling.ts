"use client"

import { keys } from "@ihsp/api"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef } from "react"
import { useArtifacts } from "../api/use-artifacts"
import { isActive } from "../lib/artifact-kinds"

/**
 * The Studio list (it polls every 3 s while anything is queued or generating) that also refreshes the usage counters
 * once an item has finished, so "6 of 20 today" and the tile limits stay right without a manual refresh.
 */
export function useArtifactPolling(notebookId: string) {
  const query = useArtifacts(notebookId)
  const queryClient = useQueryClient()
  const active = useRef<Set<string>>(new Set())

  useEffect(() => {
    const items = query.data
    if (!items) return
    const now = new Set(items.filter(isActive).map((item) => item.id))
    const finished = [...active.current].some((id) => !now.has(id))
    active.current = now
    if (finished) void queryClient.invalidateQueries({ queryKey: keys.notebooks.usage() })
  }, [query.data, queryClient])

  return query
}
