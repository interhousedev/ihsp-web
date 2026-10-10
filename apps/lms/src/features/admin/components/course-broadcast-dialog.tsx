"use client"

import { keys, postLmsCourseBroadcast, type CourseBroadcast } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Alert,
  AlertDescription,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldDescription,
  FieldLabel,
  Input,
  Spinner,
  Textarea,
} from "@ihsp/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, type FormEvent } from "react"

export const BROADCAST_TITLE_MAX = 120
export const BROADCAST_BODY_MAX = 2000

/** An update for the enrolled students: an in-app notification, Web Push and Telegram. */
export function CourseBroadcastDialog({
  courseId,
  open,
  onOpenChange,
}: {
  courseId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useT("broadcasts")
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [sent, setSent] = useState<CourseBroadcast | null>(null)

  const send = useMutation<CourseBroadcast, unknown, { title: string; body: string }>({
    mutationFn: (values) => postLmsCourseBroadcast(courseId, values),
    onSuccess: (result) => {
      setSent(result)
      setTitle("")
      setBody("")
      void queryClient.invalidateQueries({ queryKey: keys.lms.broadcasts(courseId) })
    },
  })

  function close(next: boolean) {
    if (!next) {
      setSent(null)
      send.reset()
    }
    onOpenChange(next)
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    send.mutate({ title: title.trim(), body: body.trim() })
  }

  const valid = title.trim() !== "" && body.trim() !== ""

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{t("dialogTitle")}</DialogTitle>
          </DialogHeader>

          {sent ? (
            <Alert>
              <AlertDescription>{t("sent", { count: sent.recipients ?? 0 })}</AlertDescription>
            </Alert>
          ) : null}

          <Field>
            <FieldLabel htmlFor="broadcast-title">{t("titleLabel")}</FieldLabel>
            <Input
              id="broadcast-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={BROADCAST_TITLE_MAX}
              className="h-11 md:h-8"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="broadcast-body">{t("bodyLabel")}</FieldLabel>
            <Textarea
              id="broadcast-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={BROADCAST_BODY_MAX}
              rows={6}
            />
            <FieldDescription>{t("bodyHint", { used: body.length, max: BROADCAST_BODY_MAX })}</FieldDescription>
          </Field>

          {send.isError ? (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage(send.error)}</AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => close(false)} className="min-h-11 md:min-h-8">
              {t("close")}
            </Button>
            <Button type="submit" disabled={!valid || send.isPending} className="min-h-11 md:min-h-8">
              {send.isPending ? <Spinner aria-hidden /> : null}
              {t("send")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
