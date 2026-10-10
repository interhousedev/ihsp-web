"use client"

import { postMeOutboundMail, type FileItem } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Icons,
  Input,
  Label,
  Textarea,
} from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import { useId, useState } from "react"
import { toast } from "sonner"
import { FilePicker } from "../file-upload-button"

export type ComposeMailDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Recipients to start with, for example the address of the profile the dialog was opened from. */
  initialTo?: readonly string[]
  initialSubject?: string
}

/** Splits `a@x.org, b@y.org; c@z.org` into trimmed, non-empty addresses. */
export function parseRecipients(value: string): string[] {
  return value
    .split(/[\s,;]+/)
    .map((part) => part.trim())
    .filter((part) => part !== "")
}

/**
 * Write an email from the platform: to, subject, body and one attachment from My files. Sends through
 * `POST /v1/me/outbound-mail`; the server checks the addresses, the daily limit and the file.
 */
export function ComposeMailDialog({ open, onOpenChange, initialTo = [], initialSubject = "" }: ComposeMailDialogProps) {
  const t = useT("composeMail")
  const errorMessage = useErrorMessage()
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
      setPicking(false)
      onOpenChange(false)
    },
  })

  const canSend = parseRecipients(to).length > 0 && subject.trim() !== "" && body.trim() !== "" && !send.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (canSend) send.mutate()
          }}
        >
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>

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
              <Button type="button" variant="outline" className="min-h-11" onClick={() => setPicking((value) => !value)}>
                {t("attach")}
              </Button>
            )}
            {picking && !file ? (
              <FilePicker
                enabled={open}
                onPick={(picked) => {
                  setFile(picked)
                  setPicking(false)
                }}
              />
            ) : null}
          </div>

          {send.isError ? (
            <p role="alert" className="text-destructive text-sm">
              {errorMessage(send.error)}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" className="min-h-11" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" className="min-h-11" disabled={!canSend}>
              {send.isPending ? t("sending") : t("send")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
