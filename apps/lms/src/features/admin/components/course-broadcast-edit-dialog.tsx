"use client"

import { keys, patchLmsCourseBroadcast, type CourseBroadcast } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Alert,
  AlertDescription,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
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
import { BROADCAST_BODY_MAX, BROADCAST_TITLE_MAX } from "./course-broadcast-dialog"

/** Change the title or text of a sent update (its author or a course admin); the students' notifications follow. */
export function CourseBroadcastEditDialog({
  courseId,
  broadcast,
  onClose,
}: {
  courseId: string
  broadcast: CourseBroadcast
  onClose: () => void
}) {
  const t = useT("broadcasts")
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const [title, setTitle] = useState(broadcast.title)
  const [body, setBody] = useState(broadcast.body)

  const save = useMutation({
    mutationFn: () =>
      patchLmsCourseBroadcast(courseId, broadcast.id, {
        ...(title.trim() !== broadcast.title ? { title: title.trim() } : {}),
        ...(body.trim() !== broadcast.body ? { body: body.trim() } : {}),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: keys.lms.broadcasts(courseId) })
      onClose()
    },
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    save.mutate()
  }

  const changed = title.trim() !== broadcast.title || body.trim() !== broadcast.body
  const valid = title.trim() !== "" && body.trim() !== ""

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{t("editTitle")}</DialogTitle>
          </DialogHeader>

          <Field>
            <FieldLabel htmlFor="broadcast-edit-title">{t("titleLabel")}</FieldLabel>
            <Input
              id="broadcast-edit-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={BROADCAST_TITLE_MAX}
              className="h-11 md:h-8"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="broadcast-edit-body">{t("bodyLabel")}</FieldLabel>
            <Textarea
              id="broadcast-edit-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={BROADCAST_BODY_MAX}
              rows={6}
            />
            <FieldDescription>{t("bodyHint", { used: body.length, max: BROADCAST_BODY_MAX })}</FieldDescription>
          </Field>

          {save.isError ? (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage(save.error)}</AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="min-h-11 md:min-h-8">
              {t("close")}
            </Button>
            <Button type="submit" disabled={!valid || !changed || save.isPending} className="min-h-11 md:min-h-8">
              {save.isPending ? <Spinner aria-hidden /> : null}
              {t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
