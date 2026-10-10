"use client"

import { getArtifactDownload } from "@ihsp/api"
import { useMutation } from "@tanstack/react-query"
import { documentFileName, saveBlob, type ExportFormat } from "./document-format"

export type DownloadArtifactVars = {
  artifactId: string
  title: string
  format: ExportFormat
}

/** Downloads a ready output as a .docx / .xlsx / .pptx file, or .md. */
export function useDownloadArtifact(notebookId: string) {
  return useMutation<void, unknown, DownloadArtifactVars>({
    mutationFn: async ({ artifactId, title, format }) => {
      const blob = await getArtifactDownload(notebookId, artifactId, format)
      saveBlob(documentFileName(title, format), blob)
    },
  })
}
