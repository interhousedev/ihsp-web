"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Input, Label, LoadingButton, ResponsiveDialog, Textarea } from "@ihsp/ui"
import { useState, type FormEvent } from "react"
import { toast } from "sonner"
import { useConsultationAction, type ActionBody, type Consultation } from "../api"

export type DialogAction = "accept" | "propose" | "decline" | "complete"
/** Actions that need input before they are sent; every other action is a single click. */
export const DIALOG_ACTIONS: readonly string[] = ["accept", "propose", "decline", "complete"]

const TEXT_LIMIT = 1000

/** The `datetime-local` value (local wall time) of an instant; empty when there is none. */
export function toLocalInput(value: string | undefined): string {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** Collects what `accept` / `propose` / `decline` / `complete` need: a slot and place, a reason or notes. */
export function ActionDialog({
  consultation,
  action,
  open,
  onOpenChange,
}: {
  consultation: Consultation
  action: DialogAction
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useT("consultations")
  const errorMessage = useErrorMessage()
  const run = useConsultationAction()
  const [at, setAt] = useState(() => toLocalInput(consultation.preferred_times[0]))
  const [location, setLocation] = useState("")
  const [text, setText] = useState("")
  const slotRequired = action === "propose"
  const hasSlot = action === "accept" || action === "propose"
  const canSend = !slotRequired || at !== ""

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!canSend) return
    const body: ActionBody =
      action === "decline"
        ? { reason: text.trim() }
        : action === "complete"
          ? { notes: text.trim() }
          : { at: at ? new Date(at).toISOString() : null, location: location.trim() }
    try {
      await run.mutateAsync({ id: consultation.id, action, body })
      onOpenChange(false)
      setAt("")
      setLocation("")
      setText("")
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t(`dialog.${action}`)}
      onSubmit={submit}
      footer={
        <LoadingButton type="submit" loading={run.isPending} disabled={!canSend}>
          {t(`action.staff.${action}`)}
        </LoadingButton>
      }
    >
      <div className="flex flex-col gap-3">
        {hasSlot ? (
          <>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`cons-at-${action}`}>{t("slotAt")}</Label>
              <Input
                id={`cons-at-${action}`}
                type="datetime-local"
                value={at}
                required={slotRequired}
                onChange={(event) => setAt(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`cons-loc-${action}`}>{t("slotLocation")}</Label>
              <Input
                id={`cons-loc-${action}`}
                maxLength={200}
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`cons-text-${action}`}>{t(action === "decline" ? "reason" : "notes")}</Label>
            <Textarea
              id={`cons-text-${action}`}
              maxLength={TEXT_LIMIT}
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
          </div>
        )}
      </div>
    </ResponsiveDialog>
  )
}
