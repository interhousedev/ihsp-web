"use client"

import { keys, postNotebookSources, type NotebookItem, type SourceInput } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { useCreateNotebook, useNotebooks } from "../notebooks/api"
import { useNotebookErrorMessage } from "../notebooks/lib/use-notebook-error"

/** How many recent notebooks the menu offers; the rest are one click away in the notebooks list. */
export const RECENT_NOTEBOOKS = 5

const DUPLICATE = "notebooks/source-duplicate"

export function notebookUrl(id: string, extra = ""): string {
  return `/notebooks/view/?id=${encodeURIComponent(id)}${extra}`
}

/**
 * The logic behind "Add to notebook": the recent notebooks, adding the source(s) to one of them (toast with
 * **Open notebook**; a duplicate says so) and adding to a brand new notebook, which is then opened.
 */
export function useAddToNotebook(input: SourceInput | SourceInput[]) {
  const t = useT("assistant.addToNotebook")
  const router = useRouter()
  const queryClient = useQueryClient()
  const errorMessage = useNotebookErrorMessage()
  const notebooks = useNotebooks()
  const create = useCreateNotebook()
  const [pending, setPending] = useState(false)

  const items = Array.isArray(input) ? input : [input]
  const recent: NotebookItem[] = (notebooks.data?.items ?? []).slice(0, RECENT_NOTEBOOKS)

  function refresh(notebookId: string) {
    void queryClient.invalidateQueries({ queryKey: keys.notebooks.sources(notebookId) })
    void queryClient.invalidateQueries({ queryKey: keys.notebooks.detail(notebookId) })
    void queryClient.invalidateQueries({ queryKey: [...keys.notebooks.all(), "list"] })
  }

  /** Adds to an existing notebook; resolves `true` when at least one source was added. */
  async function addTo(notebook: Pick<NotebookItem, "id" | "title">, announce = true): Promise<boolean> {
    setPending(true)
    try {
      const result = await postNotebookSources(notebook.id, { items })
      refresh(notebook.id)
      if (result.items.length > 0) {
        if (announce) {
          toast.success(t("added", { name: notebook.title }), {
            action: { label: t("open"), onClick: () => router.push(notebookUrl(notebook.id)) },
          })
        }
        return true
      }
      const rejected = result.rejected[0]
      if (rejected && rejected.error.type !== DUPLICATE) toast.error(errorMessage(rejected.error))
      else toast(t("already"))
      return false
    } catch (error) {
      toast.error(errorMessage(error))
      return false
    } finally {
      setPending(false)
    }
  }

  /** Creates a notebook, adds the source(s) and opens it. */
  async function addToNew(): Promise<void> {
    setPending(true)
    try {
      const notebook = await create.mutateAsync(undefined)
      if (await addTo(notebook, false)) router.push(notebookUrl(notebook.id))
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setPending(false)
    }
  }

  return { recent, loading: notebooks.isPending, failed: notebooks.isError, pending, addTo, addToNew }
}
