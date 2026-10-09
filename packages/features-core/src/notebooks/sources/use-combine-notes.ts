"use client"

import { getNotebookSource, type SourceItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { useState } from "react"
import { toast } from "sonner"
import { useAddSources, useSelectSources } from "../api"
import { combineNotesMarkdown } from "../lib/combine-notes"
import { useNotebookErrorMessage } from "../lib/use-notebook-error"

export type CombineRequest = {
  /** The notes to combine, in the order of the sections. */
  notes: readonly SourceItem[]
  title: string
  /** Unselect the original notes once the combined note exists. */
  unselect: boolean
}

/**
 * Combines notes into one new note: reads every body (in parallel), writes one `note` source with a `## title`
 * section per note and, on request, unselects the originals. `combine` resolves to `true` when the new note exists;
 * otherwise `error` holds the reason. A failed unselect does not undo the note: it only shows the selection toast.
 */
export function useCombineNotes(notebookId: string) {
  const t = useT("notebooks")
  const add = useAddSources(notebookId)
  const select = useSelectSources(notebookId)
  const errorMessage = useNotebookErrorMessage()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function unselectOriginals(notes: readonly SourceItem[]) {
    try {
      await select.mutateAsync({ selected: false, ids: notes.map((note) => note.id) })
    } catch {
      toast.error(t("sources.selectFailed"))
    }
  }

  async function combine({ notes, title, unselect }: CombineRequest): Promise<boolean> {
    setPending(true)
    setError(null)
    try {
      const details = await Promise.all(notes.map((note) => getNotebookSource(notebookId, note.id)))
      const body_md = combineNotesMarkdown(details.map((detail) => ({ title: detail.title, body: detail.body_md })))
      const result = await add.mutateAsync([{ kind: "note", title, body_md }])
      const rejected = result.rejected[0]
      if (rejected) {
        setError(errorMessage(rejected.error))
        return false
      }
      if (unselect) await unselectOriginals(notes)
      return true
    } catch (failure) {
      setError(errorMessage(failure))
      return false
    } finally {
      setPending(false)
    }
  }

  return { combine, pending, error, reset: () => setError(null) }
}
