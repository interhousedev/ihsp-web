"use client"

import { getArtifact, getArtifactDownload, postArtifactSaveToFiles, postShares, type ArtifactItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"
import { toast } from "sonner"
import { copyText } from "../lib/download"
import { useNotebookErrorMessage } from "../lib/use-notebook-error"
import { artifactPng } from "./artifact-png"
import { documentFileName, downloadFormats, filesFormat, saveBlob, type DownloadFormat } from "./document-format"

type Target = Pick<ArtifactItem, "id" | "kind"> & { title: string }

/**
 * Download, share and "add to my files" of a ready output. A download fetches the native file (the browser draws the
 * PNG of a mind map or an infographic); "add to my files" stores a copy through the files module; sharing makes a public
 * read-only link to the output itself (the links module, revocable in "My links"), which is copied to the clipboard.
 * Every action answers with a toast.
 */
export function useArtifactExport(notebookId: string) {
  const t = useT("notebooks")
  const queryClient = useQueryClient()
  const errorMessage = useNotebookErrorMessage()
  const fail = useCallback((error: unknown) => toast.error(errorMessage(error)), [errorMessage])

  const download = useCallback(
    async ({ id, kind, title }: Target, wanted?: DownloadFormat) => {
      const format = wanted ?? downloadFormats(kind)[0]
      if (!format) return
      try {
        const blob =
          format === "png"
            ? await artifactPng(await getArtifact(notebookId, id))
            : await getArtifactDownload(notebookId, id, format)
        saveBlob(documentFileName(title, format), blob)
      } catch (error) {
        fail(error)
      }
    },
    [notebookId, fail],
  )

  const saveToFiles = useCallback(
    async ({ id, kind }: Target) => {
      const format = filesFormat(kind)
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
    async ({ id }: Target) => {
      try {
        const link = await postShares({ kind: "artifact", target_id: id })
        if (await copyText(link.url)) toast.success(t("export.linkCopied"))
        else toast.success(link.url)
      } catch (error) {
        fail(error)
      }
    },
    [t, fail],
  )

  return { download, saveToFiles, share }
}
