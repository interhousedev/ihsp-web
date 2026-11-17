"use client"

import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import { Button, ConfirmDialog, Icons } from "@ihsp/ui"
import { useState } from "react"
import { toast } from "sonner"
import { useConsultationAction, type ConsultAction, type Consultation } from "../api"
import { ActionDialog, DIALOG_ACTIONS, type DialogAction } from "./action-dialog"
import { ConsultationStatusBadge } from "./consultation-status-badge"

const DESTRUCTIVE: readonly string[] = ["cancel", "reject", "decline"]

/** One consultation with the actions the backend allows the viewer; slot-bearing actions open a dialog. */
export function ConsultationCard({ item }: { item: Consultation }) {
  const t = useT("consultations")
  const { dateTime } = useFormatters()
  const errorMessage = useErrorMessage()
  const run = useConsultationAction()
  const [dialog, setDialog] = useState<DialogAction | null>(null)
  const [confirmCancel, setConfirmCancel] = useState(false)

  function send(action: ConsultAction) {
    run.mutate({ id: item.id, action }, { onError: (error) => toast.error(errorMessage(error)) })
  }

  return (
    <li className="bg-card flex flex-col gap-2 rounded-card border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium">
          {item.viewer === "staff" && item.student_name ? `${item.student_name} · ` : ""}
          {item.topic}
        </span>
        <ConsultationStatusBadge status={item.status} />
      </div>
      <p className="text-muted-foreground text-sm">
        {t(`with.${item.with_kind}`)} · {t(`format.${item.format}`)}
        {item.linked_kind !== "other" ? ` · ${t(`linked.${item.linked_kind}`)}` : ""}
      </p>
      {item.details ? <p className="text-sm">{item.details}</p> : null}
      {item.preferred_times.length > 0 ? (
        <p className="text-muted-foreground text-sm">
          {t("preferredTimes")}: {item.preferred_times.map((time) => dateTime(time)).join(", ")}
        </p>
      ) : null}
      {item.scheduled_at ? (
        <p className="flex items-center gap-1.5 text-sm">
          <Icons.calendar className="size-4" aria-hidden />
          {dateTime(item.scheduled_at)}
          {item.location ? ` · ${item.location}` : ""}
        </p>
      ) : null}
      {item.decline_reason ? (
        <p className="text-sm">
          {t("reason")}: {item.decline_reason}
        </p>
      ) : null}
      {item.staff_notes ? (
        <p className="text-sm">
          {t("notes")}: {item.staff_notes}
        </p>
      ) : null}
      {item.actions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {item.actions.map((action) => (
            <Button
              key={action}
              type="button"
              size="sm"
              variant={DESTRUCTIVE.includes(action) ? "outline" : "default"}
              disabled={run.isPending}
              onClick={() =>
                action === "cancel"
                  ? setConfirmCancel(true)
                  : DIALOG_ACTIONS.includes(action)
                    ? setDialog(action as DialogAction)
                    : send(action as ConsultAction)
              }
            >
              {t(`action.${item.viewer}.${action}`)}
            </Button>
          ))}
        </div>
      ) : null}
      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title={t("cancelConfirmTitle")}
        description={t("cancelConfirmText")}
        confirmLabel={t(`action.${item.viewer}.cancel`)}
        cancelLabel={t("cancelConfirmKeep")}
        destructive
        loading={run.isPending}
        onConfirm={() =>
          run.mutate(
            { id: item.id, action: "cancel" },
            { onSuccess: () => setConfirmCancel(false), onError: (error) => toast.error(errorMessage(error)) },
          )
        }
      />
      {dialog ? (
        <ActionDialog consultation={item} action={dialog} open onOpenChange={(open) => !open && setDialog(null)} />
      ) : null}
    </li>
  )
}
