"use client"

import { postMeOutboundMail, type FileItem } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Icons, Input, Label, Textarea } from "@ihsp/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useId, useState, type ReactNode } from "react"
import { toast } from "sonner"
import { DrivePicker } from "../file-upload-button"

/** Splits `a@x.org, b@y.org; c@z.org` into trimmed, non-empty addresses. */
export function parseRecipients(value: string): string[] {
  return value
    .split(/[\s,;]+/)
    .map((part) => part.trim())
    .filter((part) => part !== "")
}

export type ComposeMailFormProps = {
  /** Recipients to start with, for example the address of the profile the form was opened from. */
  initialTo?: readonly string[]
  initialSubject?: string
  /** Called after the email was sent. */
  onSent?: () => void
  /** Extra buttons before "Send", for example Cancel in a dialog. */
  actions?: ReactNode
  className?: string
}

/**
 * The compose form: to, subject, body and one attachment from My files (Drive-like picker). Sends through
 * `POST /v1/me/outbound-mail`; the server checks the addresses, the daily limit and the file.
 */
export function ComposeMailForm({
  initialTo = [],
  initialSubject = "",
  onSent,
  actions,
  className = "flex flex-col gap-4",
}: ComposeMailFormProps) {
  const t = useT("composeMail")
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const toId = useId()
  const subjectId = useId()
  const bodyId = useId()
  const [to, setTo] = useState(initialTo.join(", "))
  const [subject, setSubject] = useState(initialSubject)
  const [body, setBody] = useState("")
  const [file, setFile] = useState<FileItem | null>(null)
  const [picking, setPicking] = useState(false)

  const send = useMutation({
    mutationFn: () =>
      postMeOutboundMail({
        to: parseRecipients(to),
        subject: subject.trim(),
        body,
        attachment_file_id: file?.id ?? null,
      }),
    onSuccess: () => {
      toast.success(t("sent"))
      setBody("")
      setSubject(initialSubject)
      setFile(null)
      void queryClient.invalidateQueries({ queryKey: ["me", "outbound-mail"] })
      onSent?.()
    },
  })

  const canSend = parseRecipients(to).length > 0 && subject.trim() !== "" && body.trim() !== "" && !send.isPending

  return (
    <form
      className={className}
      onSubmit={(event) => {
        event.preventDefault()
        if (canSend) send.mutate()
      }}
    >
      <div className="flex flex-col gap-1">
        <Label htmlFor={toId}>{t("to")}</Label>
        <Input
          id={toId}
          type="text"
          inputMode="email"
          autoComplete="off"
          placeholder={t("toPlaceholder")}
          value={to}
          className="min-h-11"
          onChange={(event) => setTo(event.target.value)}
        />
        <p className="text-muted-foreground text-xs">{t("recipientsHelp")}</p>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor={subjectId}>{t("subject")}</Label>
        <Input
          id={subjectId}
          value={subject}
          maxLength={200}
          className="min-h-11"
          onChange={(event) => setSubject(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor={bodyId}>{t("body")}</Label>
        <Textarea
          id={bodyId}
          value={body}
          rows={6}
          maxLength={20000}
          onChange={(event) => setBody(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t("attachment")}</span>
        {file ? (
          <div className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
            <span className="truncate">{file.name}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("removeAttachment")}
              onClick={() => setFile(null)}
            >
              <Icons.close aria-hidden />
            </Button>
          </div>
        ) : (
          <Button type="button" variant="outline" className="min-h-11" onClick={() => setPicking(true)}>
            {t("attach")}
          </Button>
        )}
        <DrivePicker
          open={picking}
          onOpenChange={setPicking}
          uploadPurpose="link"
          onSelect={(picked) => {
            setFile(picked[0] ?? null)
            setPicking(false)
          }}
        />
      </div>

      {send.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(send.error)}
        </p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        {actions}
        <Button type="submit" className="min-h-11" disabled={!canSend}>
          {send.isPending ? t("sending") : t("send")}
        </Button>
      </div>
    </form>
  )
}
