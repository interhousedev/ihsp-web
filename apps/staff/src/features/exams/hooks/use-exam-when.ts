"use client"

import type { StaffAssessmentItem } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { useCallback } from "react"
import { usePeriodLabel } from "./use-period-label"

/** `Wed, 14 Oct · 09:00 · Room 204`; a control week without a date says which week it is. */
export function useExamWhen(): (item: StaffAssessmentItem) => string {
  const t = useT("exams")
  const f = useFormatters()
  const periodLabel = usePeriodLabel()
  return useCallback(
    (item) => {
      if (!item.has_date) return item.period ? t("weekOf", { range: periodLabel(item.period) }) : ""
      return [
        f.date(item.date, { weekday: "short", day: "numeric", month: "short" }),
        item.starts_at ? f.time(item.starts_at) : null,
        item.room ? t("room", { name: item.room }) : null,
      ]
        .filter(Boolean)
        .join(" · ")
    },
    [t, f, periodLabel],
  )
}
