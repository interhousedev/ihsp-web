"use client"

import {
  adminFeedbackKeys,
  postAdminFeedbackResponse,
  type AdminFeedbackChannel,
  type FileItem,
  type FileUploadPurpose,
} from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Checkbox, Icons, Label, Textarea } from "@ihsp/ui"
import { FileUploadButton } from "@ihsp/features-core"
import { useState, type FormEvent } from "react"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { TOUCH } from "../../shared/utils/touch"

/** Attachments of a reply are uploaded with purpose `feedback`. */
const FEEDBACK_PURPOSE: FileUploadPurpose = "feedback"

const MAX_LENGTH = 4000

/** A reply to the reporter: text, optional files, and the channels to send it through (Telegram by default). */
export function FeedbackReplyForm({ feedbackId }: { feedbackId: string }) {
  const t = useT("callForImprovements")
  const [text, setText] = useState("")
  const [files, setFiles] = useState<FileItem[]>([])
  const [channels, setChannels] = useState<AdminFeedbackChannel[]>(["telegram"])
  const [error, setError] = useState<string | null>(null)
  const reply = useAdminMutation({
    mutationFn: () =>
      postAdminFeedbackResponse(feedbackId, {
        text: text.trim(),
        attachment_file_ids: files.map((file) => file.id),
        channels,
      }),
    invalidate: [adminFeedbackKeys.all()],
    success: t("detail.reply.sent"),
    onSuccess: () => {
      setText("")
      setFiles([])
    },
  })

  const toggle = (channel: AdminFeedbackChannel, checked: boolean) =>
    setChannels((current) =>
      checked ? [...current.filter((item) => item !== channel), channel] : current.filter((item) => item !== channel),
    )

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = text.trim()
    if (trimmed === "") return setError(t("detail.reply.required"))
    if (trimmed.length > MAX_LENGTH) return setError(t("detail.reply.tooLong"))
    if (channels.length === 0) return setError(t("detail.reply.channelsRequired"))
    setError(null)
    reply.mutate(undefined)
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="feedback-reply-text">{t("detail.reply.text")}</Label>
        <Textarea
          id="feedback-reply-text"
          rows={4}
          value={text}
          aria-invalid={error !== null && text.trim() === ""}
          onChange={(event) => setText(event.target.value)}
        />
        <p className="text-muted-foreground text-xs">{t("detail.reply.textHint")}</p>
      </div>
      <div className="flex flex-col gap-2">
        {files.length > 0 ? (
          <ul className="flex flex-col gap-1">
            {files.map((file) => (
              <li key={file.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate">{file.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={TOUCH}
                  aria-label={t("detail.reply.removeFile", { name: file.name })}
                  onClick={() => setFiles((current) => current.filter((item) => item.id !== file.id))}
                >
                  <Icons.close aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
        <FileUploadButton
          purpose={FEEDBACK_PURPOSE}
          accept=".png,.jpg,.jpeg,.pdf"
          multiple
          label={t("detail.reply.attach")}
          onUploaded={(file) => setFiles((current) => [...current, file])}
        />
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">{t("detail.reply.channels")}</legend>
        {(["telegram", "mail"] as const).map((channel) => (
          <label key={channel} className="flex min-h-11 items-center gap-2 text-sm md:min-h-8">
            <Checkbox
              checked={channels.includes(channel)}
              onCheckedChange={(checked) => toggle(channel, checked === true)}
            />
            {t(`detail.channel.${channel}`)}
          </label>
        ))}
      </fieldset>
      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
      <div>
        <Button type="submit" className={TOUCH} disabled={reply.isPending}>
          {t("detail.reply.submit")}
        </Button>
      </div>
    </form>
  )
}
