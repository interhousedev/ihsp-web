"use client"

import type { AssessmentItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Badge } from "@ihsp/ui"

/**
 * "Not confirmed" for a date nobody on the staff confirmed yet (EMIS, a head student) and "Date not set yet" for a
 * control week no teacher gave this subject a date for. Nothing for a confirmed date.
 */
export function ExamBadges({ item }: { item: Pick<AssessmentItem, "status" | "has_date"> }) {
  const t = useT("exams.badge")
  const tentative = item.status === "tentative"
  if (!tentative && item.has_date) return null
  return (
    <span className="flex flex-wrap gap-1">
      {tentative ? (
        <Badge
          variant="outline"
          className="border-amber-500/60 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
        >
          {t("tentative")}
        </Badge>
      ) : null}
      {item.has_date ? null : <Badge variant="secondary">{t("undated")}</Badge>}
    </span>
  )
}
