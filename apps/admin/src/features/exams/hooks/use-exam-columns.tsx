"use client"

import type { StaffAssessmentItem } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import type { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useControlLabel } from "../../shared/hooks/use-control-label"
import { actionsCol, col } from "../../shared/utils/columns"
import { audienceLabel, fullName } from "../../shared/utils/names"
import { formatPeriod } from "../../shared/utils/period"
import { ExamRowActions } from "../components/exam-row-actions"
import { ExamStatusBadge } from "../components/exam-status-badge"

export type ExamRowHandlers = {
  /** The id of the row whose confirmation is being sent, so its button waits. */
  busyId: string | null
  onEdit: (item: StaffAssessmentItem) => void
  onConfirm: (item: StaffAssessmentItem) => void
  onDismiss: (item: StaffAssessmentItem) => void
  onSetDate: (item: StaffAssessmentItem) => void
}

/**
 * The columns of the exams table: date (the week for a subject without a date), subject, groups, kind or control week,
 * time, room, status, source, who set it, note and the row actions.
 */
export function useExamColumns({
  busyId,
  onEdit,
  onConfirm,
  onDismiss,
  onSetDate,
}: ExamRowHandlers): ColumnDef<StaffAssessmentItem, unknown>[] {
  const t = useT("exams")
  const tKind = useT("exams.kind")
  const tSource = useT("exams.source")
  const controlLabel = useControlLabel()
  const f = useFormatters()

  return useMemo(
    () => [
      col<StaffAssessmentItem>("date", t("columns.date"), (item) =>
        item.has_date || !item.period ? (
          <span className="font-medium">{f.date(item.date, { weekday: "short", day: "numeric", month: "short" })}</span>
        ) : (
          <span className="text-muted-foreground">{formatPeriod(f.date, item.period)}</span>
        ),
      ),
      col<StaffAssessmentItem>("subject", t("columns.subject"), (item) => (
        <span className="flex flex-col">
          <span className="font-medium">{item.subject.name}</span>
          {item.title ? <span className="text-muted-foreground text-xs">{item.title}</span> : null}
        </span>
      )),
      col<StaffAssessmentItem>("groups", t("columns.groups"), (item) => audienceLabel(item.audience)),
      col<StaffAssessmentItem>("kind", t("columns.kind"), (item) =>
        item.control ? controlLabel(item.control) : tKind(item.kind),
      ),
      col<StaffAssessmentItem>("time", t("columns.time"), (item) => (item.starts_at ? f.time(item.starts_at) : "—")),
      col<StaffAssessmentItem>("room", t("columns.room"), (item) => item.room ?? "—"),
      col<StaffAssessmentItem>("status", t("columns.status"), (item) => <ExamStatusBadge item={item} />),
      col<StaffAssessmentItem>("source", t("columns.source"), (item) => tSource(item.source)),
      col<StaffAssessmentItem>("setBy", t("columns.setBy"), (item) => fullName(item.created_by) || "—"),
      col<StaffAssessmentItem>("note", t("columns.note"), (item) => item.note ?? "—"),
      actionsCol<StaffAssessmentItem>(t("columns.actions"), (item) => (
        <ExamRowActions
          item={item}
          busy={busyId === item.id}
          onEdit={onEdit}
          onConfirm={onConfirm}
          onDismiss={onDismiss}
          onSetDate={onSetDate}
        />
      )),
    ],
    [busyId, onEdit, onConfirm, onDismiss, onSetDate, controlLabel, f, t, tKind, tSource],
  )
}
