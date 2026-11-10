"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, LoadingButton, ResponsiveDialog, Textarea } from "@ihsp/ui"
import { useId, useState, type FormEvent } from "react"
import { toast } from "sonner"
import type { ExcuseDecision } from "../hooks/use-excuse-actions"

const DONE = { approve: "approved", reject: "rejected", revoke: "revoked" } as const

/** Approve, reject or revoke with an optional comment (up to 2000 characters) the student sees. */
export function ExcuseDecisionDialog({
  kind,
  busy,
  onDecide,
  onClose,
}: {
  kind: ExcuseDecision | null
  busy: boolean
  onDecide: (kind: ExcuseDecision, comment: string) => Promise<unknown>
  onClose: () => void
}) {
  const t = useT("excuses.decision")
  const errorMessage = useErrorMessage()
  const id = useId()
  const [comment, setComment] = useState("")

  const close = () => {
    setComment("")
    onClose()
  }
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!kind) return
    onDecide(kind, comment.trim()).then(
      () => {
        toast.success(t(DONE[kind]))
        close()
      },
      (error: unknown) => toast.error(errorMessage(error)),
    )
  }

  return (
    <ResponsiveDialog
      open={kind !== null}
      onOpenChange={(open) => !open && close()}
      title={kind ? t(kind) : ""}
      size="sm"
      onSubmit={submit}
      footer={
        <>
          <Button type="button" variant="outline" className="min-h-11 md:min-h-8" onClick={close}>
            {t("cancel")}
          </Button>
          <LoadingButton type="submit" loading={busy} className="min-h-11 md:min-h-8">
            {t("submit")}
          </LoadingButton>
        </>
      }
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="text-sm font-medium">
          {t("comment")}
        </label>
        <Textarea
          id={id}
          value={comment}
          maxLength={2000}
          placeholder={t("placeholder")}
          onChange={(event) => setComment(event.target.value)}
        />
      </div>
    </ResponsiveDialog>
  )
}
