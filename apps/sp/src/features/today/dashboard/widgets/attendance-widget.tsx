"use client"

import { useT } from "@ihsp/i18n"
import { useToday } from "../../hooks/use-today"
import type { Widget } from "../model"
import { CardEmpty, WidgetFrame } from "../widget-frame"
import { BigNumber } from "./shared"

export function AttendanceWidget({ widget, editing }: { widget: Widget; editing?: boolean }) {
  const t = useT("today.dashboard")
  const query = useToday()
  const absences = query.data?.semester.absences
  return (
    <WidgetFrame
      widget={widget}
      editing={editing}
      title={t("kinds.attendance")}
      href="/attendance/"
      status={query.isPending ? "loading" : query.isError ? "error" : undefined}
      onRetry={() => void query.refetch()}
    >
      {absences === undefined ? (
        <CardEmpty text={t("noAttendance")} />
      ) : (
        <BigNumber value={absences} label={t("absences")} />
      )}
    </WidgetFrame>
  )
}
