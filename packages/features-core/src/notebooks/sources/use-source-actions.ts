"use client"

import type { SourceItem } from "@ihsp/api"
import { useState } from "react"
import { useExcludeSource, useRemoveSource, useSyncSource, useUpdateSource } from "../api"
import { useNotebookErrorMessage } from "../lib/use-notebook-error"

type Options = {
  /** Called after a source was removed (the viewer closes itself). */
  onRemoved?: (source: SourceItem) => void
}

/** Rename, sync, remove and exclude of sources with the dialogs' state; shared by the panel rows and the viewer menu. */
export function useSourceActions(notebookId: string, { onRemoved }: Options = {}) {
  const syncMutation = useSyncSource(notebookId)
  const updateMutation = useUpdateSource(notebookId)
  const removeMutation = useRemoveSource(notebookId)
  const excludeMutation = useExcludeSource(notebookId)
  const errorMessage = useNotebookErrorMessage()
  const [renaming, setRenaming] = useState<SourceItem | null>(null)
  const [removing, setRemoving] = useState<SourceItem | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)

  function sync(source: Pick<SourceItem, "id">) {
    setSyncError(null)
    syncMutation.mutate(source.id, { onError: (error) => setSyncError(errorMessage(error)) })
  }

  /** Syncs several sources (the "Sync outdated" button); failures are summarised in `syncError`. */
  async function syncMany(sources: readonly Pick<SourceItem, "id">[]) {
    setSyncError(null)
    const results = await Promise.allSettled(sources.map((source) => syncMutation.mutateAsync(source.id)))
    const failed = results.find((result): result is PromiseRejectedResult => result.status === "rejected")
    if (failed) setSyncError(errorMessage(failed.reason))
  }

  function rename(source: SourceItem, title: string) {
    updateMutation.mutate({ id: source.id, body: { title } }, { onSuccess: () => setRenaming(null) })
  }

  function remove(source: SourceItem) {
    removeMutation.mutate(source.id, {
      onSuccess: () => {
        setRemoving(null)
        onRemoved?.(source)
      },
    })
  }

  /** Leaves a synced source out of a subject or lesson notebook (it cannot be removed: the sync would bring it back). */
  function exclude(source: SourceItem) {
    excludeMutation.mutate(source.id, {
      onSuccess: () => onRemoved?.(source),
      onError: (error) => setSyncError(errorMessage(error)),
    })
  }

  return {
    renaming,
    removing,
    syncError,
    syncing: syncMutation.isPending,
    renamePending: updateMutation.isPending,
    renameError: updateMutation.error,
    removePending: removeMutation.isPending,
    removeError: removeMutation.error,
    startRename: (source: SourceItem) => {
      updateMutation.reset()
      setRenaming(source)
    },
    startRemove: (source: SourceItem) => {
      removeMutation.reset()
      setRemoving(source)
    },
    cancelRename: () => setRenaming(null),
    cancelRemove: () => setRemoving(null),
    sync,
    syncMany,
    rename,
    remove,
    exclude,
    excluding: excludeMutation.isPending,
  }
}

export type SourceActions = ReturnType<typeof useSourceActions>
