"use client"

import { keys, uploadFile, type FileItem } from "@ihsp/api"
import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useAddSources } from "../api"
import { useNotebookErrorMessage } from "../lib/use-notebook-error"
import { useErrorMessage } from "@ihsp/i18n"
import { useRejectReason } from "../../file-upload-button"

export type UploadRow = {
  key: string
  name: string
  phase: "uploading" | "adding" | "failed"
  fraction: number
  message: string | null
}

let rowCounter = 0

/**
 * Uploads files for the notebook and adds each verified file as a `file` source. The upload button reports its files
 * through `addFile`; files dropped on a drop zone go through `uploadDropped`. `rows` are the files still on their way
 * and the failures to show.
 */
export function useUploadToNotebook(notebookId: string) {
  const add = useAddSources(notebookId)
  const queryClient = useQueryClient()
  const notebookError = useNotebookErrorMessage()
  const uploadError = useErrorMessage()
  const rejectReason = useRejectReason()
  const [rows, setRows] = useState<UploadRow[]>([])

  function patchRow(key: string, patch: Partial<UploadRow>) {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)))
  }

  function dismiss(key: string) {
    setRows((current) => current.filter((row) => row.key !== key))
  }

  function startRow(name: string, phase: UploadRow["phase"]): string {
    rowCounter += 1
    const key = `add-upload-${rowCounter}`
    setRows((current) => [...current, { key, name, phase, fraction: 0, message: null }])
    return key
  }

  /** Adds a verified file as a source; a rejection (duplicate, limit) stays visible as a row. */
  async function addFile(file: FileItem, existingKey?: string) {
    const key = existingKey ?? startRow(file.name, "adding")
    patchRow(key, { phase: "adding", message: null })
    try {
      const result = await add.mutateAsync([{ kind: "file", file_id: file.id }])
      const rejected = result.rejected[0]
      if (rejected) patchRow(key, { phase: "failed", message: notebookError(rejected.error) })
      else dismiss(key)
    } catch (error) {
      patchRow(key, { phase: "failed", message: notebookError(error) })
    }
    void queryClient.invalidateQueries({ queryKey: keys.me.files() })
  }

  async function uploadOne(file: File) {
    const key = startRow(file.name, "uploading")
    try {
      const uploaded = await uploadFile(file, "ai_upload", (fraction) => patchRow(key, { fraction }))
      if (uploaded.status === "rejected") {
        patchRow(key, { phase: "failed", message: rejectReason(uploaded.reject_reason) })
        return
      }
      await addFile(uploaded, key)
    } catch (error) {
      patchRow(key, { phase: "failed", message: uploadError(error) })
    }
  }

  function uploadDropped(files: readonly File[]) {
    for (const file of files) void uploadOne(file)
  }

  return { rows, addFile: (file: FileItem) => addFile(file), uploadDropped, dismiss }
}

export type NotebookUploader = ReturnType<typeof useUploadToNotebook>
