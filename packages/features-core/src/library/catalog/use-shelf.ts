"use client"

import { deleteShelfEntry, isApiError, postUniLibraryPin, putShelfEntry, type ShelfState } from "@ihsp/api"
import { useErrorMessage } from "@ihsp/i18n"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"
import type { ShelfSubject } from "./card-utils"

/**
 * Shelf changes for one card or item: set a state, or remove it. An unstored UniLibrary record is pinned first (the
 * snapshot gives it an id), then put on the shelf. The state shown is local after a change, so a card updates at once.
 */
export function useShelf(item: ShelfSubject) {
  const queryClient = useQueryClient()
  const errorMessage = useErrorMessage()
  const [state, setState] = useState<ShelfState | null>(item.shelf_state)
  const [seen, setSeen] = useState(item.shelf_state)
  if (seen !== item.shelf_state) {
    // The parent refetched: follow it.
    setSeen(item.shelf_state)
    setState(item.shelf_state)
  }

  async function ensureId(): Promise<string> {
    if (item.id) return item.id
    const external = item.external
    if (!external) throw new Error("Item has no id")
    const pinned = await postUniLibraryPin(external.external_id, { category: external.category })
    if (!pinned.id) throw new Error("Pinned record has no id")
    return pinned.id
  }

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ["library", "me"] })
    void queryClient.invalidateQueries({ queryKey: ["library", "item"] })
  }

  const set = useMutation({
    mutationFn: async (next: ShelfState) => putShelfEntry(await ensureId(), { state: next }),
    onSuccess: (entry) => {
      setState(entry.state)
      refresh()
    },
    onError: (error) => toast.error(isApiError(error) ? errorMessage(error) : errorMessage(null)),
  })
  const remove = useMutation({
    mutationFn: async () => {
      if (!item.id) return
      await deleteShelfEntry(item.id)
    },
    onSuccess: () => {
      setState(null)
      refresh()
    },
    onError: (error) => toast.error(isApiError(error) ? errorMessage(error) : errorMessage(null)),
  })

  return {
    state,
    pending: set.isPending || remove.isPending,
    set: (next: ShelfState) => set.mutate(next),
    remove: () => remove.mutate(),
  }
}
