"use client"

import { useState } from "react"
import { useAddSources } from "../api"
import { useNotebookErrorMessage } from "../lib/use-notebook-error"
import type { PendingItem } from "./add-types"

/** An item the backend refused (duplicate, not allowed, too large ...) and the reason in the user's language. */
export type Rejection = { key: string; label: string; reason: string }

/**
 * One `POST /notebooks/{id}/sources` for everything chosen. Resolves to the keys of the refused items (empty when all
 * went through) or `null` when the whole request failed (`error` then holds the message).
 */
export function useAddSubmit(notebookId: string) {
  const add = useAddSources(notebookId)
  const errorMessage = useNotebookErrorMessage()
  const [rejections, setRejections] = useState<Rejection[]>([])
  const [error, setError] = useState<string | null>(null)

  async function submit(items: readonly PendingItem[]): Promise<ReadonlySet<string> | null> {
    setRejections([])
    setError(null)
    try {
      const result = await add.mutateAsync(items.map((item) => item.input))
      const refused = result.rejected.flatMap((entry) => {
        const item = items[entry.index]
        return item ? [{ key: item.key, label: item.label, reason: errorMessage(entry.error) }] : []
      })
      setRejections(refused)
      return new Set(refused.map((entry) => entry.key))
    } catch (failure) {
      setError(errorMessage(failure))
      return null
    }
  }

  return { submit, pending: add.isPending, rejections, error }
}
