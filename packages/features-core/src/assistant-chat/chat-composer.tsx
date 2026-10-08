"use client"

import type { FileItem } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Button, Textarea } from "@ihsp/ui"
import { IconFiles, IconSend } from "@tabler/icons-react"
import { useId, useState, type KeyboardEvent } from "react"
import { FileUploadButton } from "../file-upload-button"
import { AttachFilesDialog } from "./attach-files-dialog"
import { FileChip } from "./file-chip"
import type { LimitState } from "./limit-info"

type ChatComposerProps = {
  sending: boolean
  limit: LimitState
  /** Resolves `true` when the message was sent; on `false` the draft comes back. */
  onSend: (text: string, files: FileItem[]) => Promise<boolean>
}

function isTouchDevice(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches
}

/** The input of a chat: text, attached files (upload or from My files) and the limit notice (AI-7, AI-8). */
export function ChatComposer({ sending, limit, onSend }: ChatComposerProps) {
  const t = useT("assistant.composer")
  const format = useFormatters()
  const inputId = useId()
  const [text, setText] = useState("")
  const [files, setFiles] = useState<FileItem[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)

  const locked = limit.reached
  const canSend = !locked && !sending && text.trim().length > 0

  async function submit() {
    if (!canSend) return
    const draft = { text: text.trim(), files }
    setText("")
    setFiles([])
    const sent = await onSend(draft.text, draft.files)
    if (!sent) {
      setText((current) => (current === "" ? draft.text : current))
      setFiles((current) => (current.length === 0 ? draft.files : current))
    }
  }

  function addFiles(added: FileItem[]) {
    setFiles((current) => [...current, ...added.filter((file) => !current.some((item) => item.id === file.id))])
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return
    if (isTouchDevice()) return
    event.preventDefault()
    void submit()
  }

  const resetTime = limit.reached && limit.resetsAt ? format.time(limit.resetsAt) : "—"
  const limitText = limit.reached
    ? limit.scope === "session"
      ? t("limitSession", { time: resetTime })
      : t("limitDay", { time: resetTime })
    : null

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
    >
      {limitText ? (
        <p role="status" className="bg-muted text-muted-foreground rounded-lg border px-3 py-2 text-sm">
          {limitText}
        </p>
      ) : null}
      {files.length > 0 ? (
        <div className="flex flex-wrap gap-1" aria-label={t("attached")}>
          {files.map((file) => (
            <FileChip
              key={file.id}
              file={file}
              onRemove={() => setFiles((current) => current.filter((item) => item.id !== file.id))}
            />
          ))}
        </div>
      ) : null}
      <div className="flex items-end gap-2">
        <div className="flex shrink-0 items-center gap-1">
          <FileUploadButton
            purpose="ai_upload"
            multiple
            iconOnly
            variant="ghost"
            label={t("upload")}
            disabled={locked}
            onUploaded={(file) => addFiles([file])}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11"
            aria-label={t("pickFiles")}
            disabled={locked}
            onClick={() => setPickerOpen(true)}
          >
            <IconFiles aria-hidden />
          </Button>
        </div>
        <label htmlFor={inputId} className="sr-only">
          {t("label")}
        </label>
        <Textarea
          id={inputId}
          value={text}
          rows={1}
          disabled={locked}
          placeholder={locked ? t("disabledPlaceholder") : t("placeholder")}
          className="max-h-40 min-h-11 flex-1 resize-none"
          onChange={(event) => setText(event.target.value)}
          onKeyDown={onKeyDown}
        />
        <Button type="submit" size="icon" className="size-11 shrink-0" aria-label={t("send")} disabled={!canSend}>
          <IconSend aria-hidden />
        </Button>
      </div>
      <AttachFilesDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        attachedIds={new Set(files.map((file) => file.id))}
        onPick={addFiles}
      />
    </form>
  )
}
