"use client"

import { keys, type ArtifactDetail } from "@ihsp/api"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useRef } from "react"
import { useSaveProgress } from "../api/use-artifacts"

const DEBOUNCE_MS = 500

/**
 * Saves the progress of flash cards and quiz: `save(state)` waits 500 ms for further changes, then sends one `PUT
 * .../progress`; the last state is also sent when the viewer closes. The cached artifact gets the state at once, so
 * reopening the viewer starts where the student left off even before the server answered.
 */
export function useDebouncedProgress(notebookId: string, artifactId: string): (state: object) => void {
  const queryClient = useQueryClient()
  const { mutate } = useSaveProgress(notebookId, artifactId)
  const pending = useRef<object | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flush = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current)
      timer.current = null
    }
    const state = pending.current
    if (state === null) return
    pending.current = null
    queryClient.setQueryData<ArtifactDetail>(keys.notebooks.artifact(notebookId, artifactId), (current) =>
      current ? { ...current, progress_state: state } : current,
    )
    mutate(state)
  }, [artifactId, mutate, notebookId, queryClient])

  const save = useCallback(
    (state: object) => {
      pending.current = state
      if (timer.current !== null) clearTimeout(timer.current)
      timer.current = setTimeout(flush, DEBOUNCE_MS)
    },
    [flush],
  )

  useEffect(() => flush, [flush])

  return save
}
