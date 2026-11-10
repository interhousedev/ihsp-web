"use client"

import type { FileItem } from "@ihsp/api"
import { FileUploadButton } from "@ihsp/features-core"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Label, Textarea } from "@ihsp/ui"
import { useId, useState, type FormEvent } from "react"
import { usePostExcuseMessage } from "../api/use-excuse-mutations"

const BODY_MAX = 2000

/** Writes a line to the curators, optionally with files. */
export function ExcuseMessageForm({ excuseId }: { excuseId: string }) {
  const t = useT("excuses")
  const errorMessage = useErrorMessage()
  const id = useId()
  const post = usePostExcuseMessage(excuseId)
  const [body, setBody] = useState("")
  const [files, setFiles] = useState<FileItem[]>([])
  const canSend = (body.trim().length > 0 || files.length > 0) && !post.isPending

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSend) return
    post.mutate(
      { body: body.trim() || null, file_ids: files.map((file) => file.id) },
      {
        onSuccess: () => {
          setBody("")
          setFiles([])
        },
      },
    )
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
      <Label htmlFor={id}>{t("thread.write")}</Label>
      <Textarea id={id} value={body} maxLength={BODY_MAX} rows={3} onChange={(event) => setBody(event.target.value)} />
      {files.length > 0 ? (
        <ul className="text-muted-foreground flex flex-col gap-1 text-sm">
          {files.map((file) => (
            <li key={file.id} className="truncate">
              {file.name}
            </li>
          ))}
        </ul>
      ) : null}
      {post.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(post.error)}
        </p>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
        <FileUploadButton
          purpose="feedback"
          multiple
          label={t("form.attach")}
          onUploaded={(file) => setFiles((rows) => [...rows, file])}
        />
        <Button type="submit" className="min-h-11 md:min-h-8" disabled={!canSend}>
          {post.isPending ? t("thread.sending") : t("thread.send")}
        </Button>
      </div>
    </form>
  )
}
