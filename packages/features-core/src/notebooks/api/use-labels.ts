"use client"

import {
  deleteNotebookLabel,
  getNotebookLabelsQuery,
  keys,
  patchNotebookLabel,
  postNotebookLabelsAuto,
  type LabelsResponse,
} from "@ihsp/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"

const POLL_MS = 2000

/** The topic labels of a notebook; polls every 2 s while an automatic labelling run is going on. */
export function useLabels(notebookId: string) {
  return useQuery({
    ...getNotebookLabelsQuery(notebookId),
    refetchInterval: (query) => (query.state.data?.auto.status === "running" ? POLL_MS : false),
  })
}

export type AutoLabel = {
  /** Starts the run (labels the selected, ready sources). */
  start: () => void
  /** The run was accepted or is going on (this or another tab). */
  busy: boolean
  /** The last run failed, or it could not be started. */
  failed: boolean
}

/**
 * The "Auto-label" action: `POST …/labels/auto` answers at once, the run finishes in the background and the labels
 * query is polled until it does. When it stops, the sources are read again (they carry `label_ids`) and `onFinished`
 * tells whether it worked.
 */
export function useAutoLabel(notebookId: string, onFinished?: (ok: boolean) => void): AutoLabel {
  const queryClient = useQueryClient()
  const labels = useLabels(notebookId)
  const status = labels.data?.auto.status
  const previous = useRef(status)
  const finished = useRef(onFinished)
  finished.current = onFinished
  // A failed run left over from earlier is not an error on load; only a run seen going on in this session is.
  const [runFailed, setRunFailed] = useState(false)

  const start = useMutation({
    mutationFn: () => postNotebookLabelsAuto(notebookId),
    onMutate: () => setRunFailed(false),
    onSuccess: () => {
      queryClient.setQueryData<LabelsResponse>(keys.notebooks.labels(notebookId), (current) =>
        current ? { ...current, auto: { ...current.auto, status: "running" } } : current,
      )
      void queryClient.invalidateQueries({ queryKey: keys.notebooks.labels(notebookId) })
    },
  })

  useEffect(() => {
    if (previous.current === "running" && status !== "running") {
      void queryClient.invalidateQueries({ queryKey: keys.notebooks.sources(notebookId) })
      setRunFailed(status === "failed")
      finished.current?.(status === "idle")
    }
    previous.current = status
  }, [status, queryClient, notebookId])

  return {
    start: () => start.mutate(),
    busy: start.isPending || status === "running",
    failed: start.isError || (runFailed && !start.isPending),
  }
}

/** Renames a label; an automatic label turns manual (the server keeps it from then on). */
export function useRenameLabel(notebookId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => patchNotebookLabel(notebookId, id, { name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.notebooks.labels(notebookId) }),
  })
}

/** Deletes a label; its sources stay and lose it. */
export function useDeleteLabel(notebookId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteNotebookLabel(notebookId, id),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: keys.notebooks.labels(notebookId) }),
        queryClient.invalidateQueries({ queryKey: keys.notebooks.sources(notebookId) }),
      ]),
  })
}
