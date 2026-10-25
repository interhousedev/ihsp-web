"use client"

import { keys, type ItemDetail } from "@ihsp/api"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRef, useState } from "react"
import type { MaterialValues } from "./material-values"
import { newMemory, saveMaterial, submitMaterial, type SaveMemory, type SaveProgress } from "./save-material"

export type MaterialWorkflow = {
  /** The id of the draft once it exists on the server. */
  itemId: string | null
  /** Saves the draft (creates it on the first call). Resolves with the detail, or `null` when it failed. */
  save: (values: MaterialValues) => Promise<ItemDetail | null>
  /** Saves and submits. Resolves with the submitted item (`pending_review` or `published`), or `null` on failure. */
  submit: (values: MaterialValues) => Promise<ItemDetail | null>
  pending: boolean
  progress: SaveProgress | null
  /** The error of the last attempt. */
  error: unknown
  clearError: () => void
}

/**
 * The server side of the wizard: `postMaterial` → `uploadFile` for each file → `postMaterialFiles` → `postMaterialSubmit`.
 * It remembers what already reached the server, so after an error the same call can simply be repeated.
 */
export function useMaterialWorkflow({
  itemId: initialId = null,
  canPublish,
}: {
  itemId?: string | null
  canPublish: boolean
}): MaterialWorkflow {
  const queryClient = useQueryClient()
  const memory = useRef<SaveMemory>(newMemory(initialId))
  const [itemId, setItemId] = useState<string | null>(initialId)
  const [progress, setProgress] = useState<SaveProgress | null>(null)

  const finish = () => {
    setProgress(null)
    setItemId(memory.current.itemId)
    void queryClient.invalidateQueries({ queryKey: keys.library.all() })
  }
  const saving = useMutation({
    mutationFn: (values: MaterialValues) =>
      saveMaterial({ values, canPublish, memory: memory.current, report: setProgress }),
    onSettled: finish,
  })
  const submitting = useMutation({
    mutationFn: (values: MaterialValues) =>
      submitMaterial({ values, canPublish, memory: memory.current, report: setProgress }),
    onSettled: finish,
  })

  return {
    itemId,
    save: (values) => {
      submitting.reset()
      return saving.mutateAsync(values).catch(() => null)
    },
    submit: (values) => {
      saving.reset()
      return submitting.mutateAsync(values).catch(() => null)
    },
    pending: saving.isPending || submitting.isPending,
    progress,
    error: submitting.error ?? saving.error,
    clearError: () => {
      saving.reset()
      submitting.reset()
    },
  }
}
