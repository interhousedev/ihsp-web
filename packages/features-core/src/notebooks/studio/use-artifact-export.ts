"use client"

import { getArtifactDownload, postArtifactSaveToFiles, postLinks, type ArtifactItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"
import { toast } from "sonner"
import { copyText } from "../lib/download"
import { useNotebookErrorMessage } from "../lib/use-notebook-error"
import { documentFileName, exportFormat, saveBlob } from "./document-format"

type Target = Pick<ArtifactItem, "id" | "kind"> & { title: string }

/**
 * Download, share and "add to my files" of a ready output. A download fetches the file; "add to my files" stores a
 * copy through the files module; sharing stores that copy and makes a short link to it (the links module), which is
 * copied to the clipboard. Every action answers with a toast.
 */
export function useArtifactExport(notebookId: string) {
  const t = useT("notebooks")
  const queryClient = useQueryClient()
  const errorMessage = useNotebookErrorMessage()
  const fail = useCallback((error: unknown) => toast.error(errorMessage(error)), [errorMessage])

  const download = useCallback(
    async ({ id, kind, title }: Target) => {
      const format = exportFormat(kind)
      if (!format) return
      try {
        saveBlob(documentFileName(title, format), await getArtifactDownload(notebookId, id, format))
      } catch (error) {
        fail(error)
      }
    },
    [notebookId, fail],
  )

  const saveToFiles = useCallback(
    async ({ id, kind }: Target) => {
      const format = exportFormat(kind)
      if (!format) return
      try {
        const file = await postArtifactSaveToFiles(notebookId, id, { format })
        void queryClient.invalidateQueries({
          queryKey: ["me", "files"] as const,
        })
        toast.success(t("export.savedToFiles", { name: file.name }))
      } catch (error) {
        fail(error)
      }
    },
    [notebookId, queryClient, t, fail],
  )

  const share = useCallback(
    async ({ id, kind }: Target) => {
      const format = exportFormat(kind)
      if (!format) return
      try {
        const file = await postArtifactSaveToFiles(notebookId, id, { format })
        const link = await postLinks({ kind: "file", file_id: file.id })
        void queryClient.invalidateQueries({
          queryKey: ["me", "files"] as const,
        })
        if (await copyText(link.url)) toast.success(t("export.linkCopied"))
        else toast.success(link.url)
      } catch (error) {
        fail(error)
      }
    },
    [notebookId, queryClient, t, fail],
  )

  return { download, saveToFiles, share }
}
