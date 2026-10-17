"use client"

import type { GroupProgressCell } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { formatMark, formatPercent } from "./format"

/** One student's result in one subject: the semester mark, ПК and ИК averages, absences and their share. */
export function ProgressCell({ cell }: { cell: GroupProgressCell | undefined }) {
  const t = useT("groupProgress")
  if (!cell) return <span className="text-muted-foreground">–</span>
  return (
    <div className="flex flex-col items-start gap-0.5 tabular-nums">
      <span className="text-lg leading-tight font-semibold">{formatMark(cell.semester_mark)}</span>
      <span className="text-muted-foreground text-xs">
        {t("shortMidterm")} {formatMark(cell.midterm_avg)} · {t("shortFinal")} {formatMark(cell.final_avg)}
      </span>
      <span className="text-muted-foreground text-xs">
        {cell.absences}/{cell.lessons} · {formatPercent(cell.absence_rate)}
      </span>
    </div>
  )
}
