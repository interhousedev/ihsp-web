"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Input,
  LoadingButton,
  ResponsiveDialog,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ihsp/ui"
import { useState, type FormEvent } from "react"
import { toast } from "sonner"
import { useEditDeadline, type Deadline } from "../api"
import { useWorkflow } from "../../../lib/config"

/** PATCH /staff/deadlines/{id}: status, date and the source quote. */
export function DeadlineDialog({
  item,
  open,
  onOpenChange,
}: {
  item: Deadline
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useT("deadlines")
  const workflow = useWorkflow()
  const errorMessage = useErrorMessage()
  const edit = useEditDeadline()
  const [status, setStatus] = useState(item.status)
  const [localDate, setLocalDate] = useState(item.local_date ?? "")
  const [source, setSource] = useState(item.source_text ?? "")

  async function submit(event: FormEvent) {
    event.preventDefault()
    try {
      await edit.mutateAsync({ id: item.id, status, local_date: localDate || null, source_text: source || null })
      onOpenChange(false)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("editTitle")}
      onSubmit={submit}
      footer={
        <LoadingButton type="submit" loading={edit.isPending}>
          {t("save")}
        </LoadingButton>
      }
    >
      <div className="flex flex-col gap-3">
        <Select value={status} onValueChange={(value) => value && setStatus(value)}>
          <SelectTrigger aria-label={t("statusLabel")} className="min-h-11 w-full md:min-h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {workflow.deadline_statuses.map((value) => (
              <SelectItem key={value} value={value}>
                {t(`status.${value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="flex flex-col gap-1 text-sm">
          {t("dateLabel")}
          <Input type="date" value={localDate} onChange={(e) => setLocalDate(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t("sourceLabel")}
          <Input value={source} onChange={(e) => setSource(e.target.value)} />
        </label>
      </div>
    </ResponsiveDialog>
  )
}
