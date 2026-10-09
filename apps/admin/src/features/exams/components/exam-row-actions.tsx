"use client"

import type { StaffAssessmentItem } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Button } from "@ihsp/ui"
import { audienceLabel } from "../../shared/utils/names"
import { TOUCH } from "../../shared/utils/touch"

/**
 * What can be done with a row: a week without a date gets "Set date"; a date that is not confirmed can be confirmed,
 * edited or dismissed; a planned one can be edited or cancelled; a cancelled one has no actions.
 */
export function ExamRowActions({
  item,
  busy,
  onEdit,
  onConfirm,
  onDismiss,
  onSetDate,
}: {
  item: StaffAssessmentItem
  busy: boolean
  onEdit: (item: StaffAssessmentItem) => void
  onConfirm: (item: StaffAssessmentItem) => void
  onDismiss: (item: StaffAssessmentItem) => void
  onSetDate: (item: StaffAssessmentItem) => void
}) {
  const t = useT("exams.actions")
  const f = useFormatters()
  const subject = item.subject.name
  const date = f.date(item.date)

  if (!item.has_date) {
    return (
      <Button
        type="button"
        variant="outline"
        className={TOUCH}
        aria-label={t("setDateLabel", { subject, groups: audienceLabel(item.audience) })}
        onClick={() => onSetDate(item)}
      >
        {t("setDate")}
      </Button>
    )
  }
  if (item.status === "cancelled") return null

  const tentative = item.status === "tentative"
  return (
    <>
      {tentative ? (
        <Button
          type="button"
          className={TOUCH}
          disabled={busy}
          aria-label={t("confirmLabel", { subject, date })}
          onClick={() => onConfirm(item)}
        >
          {t("confirm")}
        </Button>
      ) : null}
      <Button
        type="button"
        variant="outline"
        className={TOUCH}
        aria-label={t("editLabel", { subject, date })}
        onClick={() => onEdit(item)}
      >
        {t("edit")}
      </Button>
      <Button
        type="button"
        variant="outline"
        className={TOUCH}
        aria-label={tentative ? t("dismissLabel", { subject, date }) : t("cancelLabel", { subject, date })}
        onClick={() => onDismiss(item)}
      >
        {tentative ? t("dismiss") : t("cancel")}
      </Button>
    </>
  )
}
