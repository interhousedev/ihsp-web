"use client"

import type { ExcuseMessageBody } from "@ihsp/api"
import { FileUploadButton } from "@ihsp/features-core"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Textarea } from "@ihsp/ui"
import { useState, type FormEvent } from "react"
import { toast } from "sonner"

const MAX_FILES = 10

/** Writes a message to the thread; documents go through the file upload and are sent as `file_ids`. */
export function ExcuseMessageForm({
  busy,
  onSend,
}: {
  busy: boolean
  onSend: (body: ExcuseMessageBody) => Promise<unknown>
}) {
  const t = useT("excuses.thread")
  const errorMessage = useErrorMessage()
  const [text, setText] = useState("")
  const [files, setFiles] = useState<{ id: string; name: string }[]>([])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const body = text.trim()
    if (!body && files.length === 0) return
    onSend({ ...(body ? { body } : {}), ...(files.length > 0 ? { file_ids: files.map((file) => file.id) } : {}) }).then(
      () => {
        setText("")
        setFiles([])
        toast.success(t("sent"))
      },
      (error: unknown) => toast.error(errorMessage(error)),
    )
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <Textarea
        value={text}
        aria-label={t("label")}
        placeholder={t("placeholder")}
        maxLength={4000}
        onChange={(event) => setText(event.target.value)}
      />
      {files.length > 0 ? (
        <ul className="flex flex-wrap gap-2 text-sm">
          {files.map((file) => (
            <li key={file.id} className="rounded-lg border px-2 py-1">
              {file.name}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <FileUploadButton
          purpose="feedback"
          multiple
          variant="outline"
          label={t("attach")}
          disabled={busy || files.length >= MAX_FILES}
          onUploaded={(file) =>
            setFiles((current) => [...current, { id: file.id, name: file.name }].slice(0, MAX_FILES))
          }
        />
        <Button type="submit" className="min-h-11 md:min-h-8" disabled={busy || (!text.trim() && files.length === 0)}>
          {t("send")}
        </Button>
      </div>
    </form>
  )
}
