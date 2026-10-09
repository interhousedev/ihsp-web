"use client"

import type { StaffAssessmentItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Badge, Button, cn } from "@ihsp/ui"
import { useAudienceLabel } from "../../shared/hooks/use-audience-label"
import { useExamWhen } from "../hooks/use-exam-when"
import { statusOf } from "../utils/controls"
import { ExamStatusBadge } from "./exam-status-badge"

export type ExamRowActions = {
  onEdit: (item: StaffAssessmentItem) => void
  onConfirm: (item: StaffAssessmentItem) => void
  onDismiss: (item: StaffAssessmentItem) => void
  onSetDate: (item: StaffAssessmentItem) => void
}

/**
 * One control of the list: subject, date, time and room, the status and who set it, the note for students and the
 * actions that fit: Edit and Cancel for a planned one, Edit, Confirm and Dismiss for a suggestion, Set date for a
 * control week without a date.
 */
export function ExamRow({
  item,
  busy,
  actions,
}: {
  item: StaffAssessmentItem
  busy: boolean
  actions: ExamRowActions
}) {
  const t = useT("exams")
  const audienceLabel = useAudienceLabel()
  const when = useExamWhen()
  const status = statusOf(item)
  const subject = item.subject.name
  const split = item.audience.length > 1 || item.audience.some((entry) => entry.subgroup !== null)
  const details = [
    item.control === null ? t(`kinds.${item.kind}`) : null,
    item.title !== "" ? item.title : null,
    split ? audienceLabel(item.audience) : null,
  ].filter(Boolean)
  const buttonClass = "min-h-11 md:min-h-8"

  return (
    <li
      data-status={status}
      className={cn(
        "flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-start sm:justify-between",
        item.has_date && item.days_left < 0 && "opacity-70",
      )}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{subject}</span>
          <ExamStatusBadge status={status} />
          {status !== "undated" ? <Badge variant="outline">{t(`sources.${item.source}`)}</Badge> : null}
        </div>
        <p className="text-muted-foreground text-sm">{when(item)}</p>
        {details.length > 0 ? <p className="text-muted-foreground text-xs">{details.join(" · ")}</p> : null}
        {item.note ? <p className="line-clamp-2 text-sm">{item.note}</p> : null}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {status === "undated" ? (
          <Button
            className={buttonClass}
            disabled={busy}
            aria-label={t("actions.setDateFor", { subject })}
            onClick={() => actions.onSetDate(item)}
          >
            {t("actions.setDate")}
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              className={buttonClass}
              disabled={busy}
              aria-label={t("actions.editFor", { subject })}
              onClick={() => actions.onEdit(item)}
            >
              {t("actions.edit")}
            </Button>
            {status === "tentative" ? (
              <Button
                className={buttonClass}
                disabled={busy}
                aria-label={t("actions.confirmFor", { subject })}
                onClick={() => actions.onConfirm(item)}
              >
                {t("actions.confirm")}
              </Button>
            ) : null}
            <Button
              variant="ghost"
              className={buttonClass}
              disabled={busy}
              aria-label={
                status === "tentative" ? t("actions.dismissFor", { subject }) : t("actions.cancelFor", { subject })
              }
              onClick={() => actions.onDismiss(item)}
            >
              {status === "tentative" ? t("actions.dismiss") : t("actions.cancel")}
            </Button>
          </>
        )}
      </div>
    </li>
  )
}
