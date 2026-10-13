"use client"

import { uploadFile, type NotebookDetail } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@ihsp/ui"
import { IconBook, IconPlus, IconSchool, IconUpload } from "@ihsp/ui"
import { useRef, useState } from "react"
import { useAddSources } from "../api"
import { AttachPickerDialog, type PickerMode } from "./attach-picker-dialog"
import type { AttachedItem } from "./chat-attachments"

let uploadCounter = 0

type ComposerAddMenuProps = {
  notebook: NotebookDetail
  disabled: boolean
  /** Adds a chip, or replaces the chip with the same key (an upload that finished). */
  onAttach: (item: AttachedItem) => void
  onDetach: (key: string) => void
  onError: (message: string) => void
}

/**
 * The (+) button of the composer: "Upload files" (a file becomes a source of the notebook and is asked about;
 * personal notebooks only, automatic ones take no files), "Add lesson" and "Search materials" (the notebook's
 * subject; lessons and materials go with the question as attachments).
 */
export function ComposerAddMenu({ notebook, disabled, onAttach, onDetach, onError }: ComposerAddMenuProps) {
  const t = useT("notebooks")
  const add = useAddSources(notebook.id)
  const fileRef = useRef<HTMLInputElement>(null)
  const [picker, setPicker] = useState<PickerMode | null>(null)
  const canUpload = notebook.can_write && notebook.auto === null
  const subjectId = notebook.subject_id
  const itemClass = "min-h-11 md:min-h-8"

  async function uploadOne(file: File) {
    uploadCounter += 1
    const key = `file:upload-${uploadCounter}`
    onAttach({ kind: "file", key, label: file.name, pending: true })
    try {
      const uploaded = await uploadFile(file, "ai_upload")
      if (uploaded.status === "rejected") throw new Error(uploaded.reject_reason ?? "rejected")
      const result = await add.mutateAsync([{ kind: "file", file_id: uploaded.id }])
      const source = result.items[0]
      if (!source) throw new Error("rejected")
      onAttach({ kind: "file", key, label: file.name, sourceId: source.id })
    } catch {
      onDetach(key)
      onError(t("attach.uploadFailed", { name: file.name }))
    }
  }

  if (!canUpload && !subjectId) return null
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11 rounded-full"
              aria-label={t("attach.menu")}
              title={t("attach.menu")}
              disabled={disabled}
            />
          }
        >
          <IconPlus aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {canUpload ? (
            <DropdownMenuItem className={itemClass} onClick={() => fileRef.current?.click()}>
              <IconUpload aria-hidden />
              {t("attach.upload")}
            </DropdownMenuItem>
          ) : null}
          {subjectId ? (
            <>
              <DropdownMenuItem className={itemClass} onClick={() => setPicker("lesson")}>
                <IconSchool aria-hidden />
                {t("attach.lesson")}
              </DropdownMenuItem>
              <DropdownMenuItem className={itemClass} onClick={() => setPicker("material")}>
                <IconBook aria-hidden />
                {t("attach.materials")}
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      {canUpload ? (
        <input
          ref={fileRef}
          type="file"
          multiple
          hidden
          aria-label={t("attach.upload")}
          onChange={(event) => {
            const files = [...(event.target.files ?? [])]
            event.target.value = ""
            for (const file of files) void uploadOne(file)
          }}
        />
      ) : null}
      {subjectId ? (
        <AttachPickerDialog
          subjectId={subjectId}
          mode={picker}
          onOpenChange={(open) => {
            if (!open) setPicker(null)
          }}
          onPick={onAttach}
        />
      ) : null}
    </>
  )
}
