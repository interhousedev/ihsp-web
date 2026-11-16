"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  LoadingButton,
  ResponsiveDialog,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@ihsp/ui"
import { useState, type FormEvent } from "react"
import { toast } from "sonner"
import { useReviewDocument } from "../api"
import { useWorkflow } from "../../../lib/config"

const NOTE_LIMIT = 300

/** POST /documents/{id}/review with accept=false: a reason code and a short note. */
export function RejectDialog({
  id,
  open,
  onOpenChange,
}: {
  id: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useT("documents")
  const errorMessage = useErrorMessage()
  const review = useReviewDocument()
  const [reason, setReason] = useState("")
  const workflow = useWorkflow()
  const [note, setNote] = useState("")

  async function submit(event: FormEvent) {
    event.preventDefault()
    try {
      await review.mutateAsync({
        id,
        accept: false,
        reason_code: reason || workflow.reject_reasons[0],
        note: note.trim() || null,
      })
      onOpenChange(false)
      setNote("")
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("rejectTitle")}
      onSubmit={submit}
      footer={
        <LoadingButton type="submit" variant="destructive" loading={review.isPending}>
          {t("reject")}
        </LoadingButton>
      }
    >
      <div className="flex flex-col gap-3">
        <Select value={reason || workflow.reject_reasons[0]} onValueChange={(value) => value && setReason(value)}>
          <SelectTrigger aria-label={t("reasonLabel")} className="min-h-11 w-full md:min-h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {workflow.reject_reasons.map((value) => (
              <SelectItem key={value} value={value}>
                {t(`reason.${value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Textarea
          aria-label={t("noteLabel")}
          maxLength={NOTE_LIMIT}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </div>
    </ResponsiveDialog>
  )
}
