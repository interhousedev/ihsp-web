"use client"

import { useFormatters, useT } from "@ihsp/i18n"
import { Stat, SemesterSwitcher, useIsMobile } from "@ihsp/ui"
import { parseAsInteger, useQueryState } from "nuqs"
import { useCurrentSemester } from "../../subjects/hooks/use-subjects"
import { QueryState } from "../../shared/components/query-state"
import { useSemesterGrades } from "../hooks/use-grades"
import { EmisBanner } from "./emis-banner"
import { GradesCards } from "./grades-cards"
import { GradesTable } from "./grades-table"

/** Semester grades (WEB-12, WEB-16, UF-WEB-09): GPA, sync time and the table (cards below 768 px). */
export function SemesterGradesTab() {
  const t = useT("grades.semester")
  const f = useFormatters()
  const isMobile = useIsMobile()
  const [semesterParam, setSemester] = useQueryState("semester", parseAsInteger)
  const current = useCurrentSemester()
  const semester = semesterParam ?? undefined
  const query = useSemesterGrades(semester)
  const selected = semester ?? query.data?.semester ?? current ?? 1
  const available = Array.from({ length: Math.max(current ?? 1, selected) }, (_, index) => ({ value: index + 1 }))

  return (
    <div className="flex flex-col gap-4">
      <EmisBanner />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SemesterSwitcher
          value={selected}
          onChange={(next) => void setSemester(next === current ? null : next)}
          semesters={available}
        />
        {query.data?.synced_at ? (
          <p className="text-muted-foreground text-xs">{t("updated", { when: f.relative(query.data.synced_at) })}</p>
        ) : null}
      </div>
      <QueryState query={query} rows={4}>
        {(grades) => (
          <>
            <Stat label={t("gpa")} value={grades.gpa === null ? "–" : grades.gpa.toFixed(2)} className="md:max-w-xs" />
            {grades.synced_at === null && grades.rows.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t("importing")}</p>
            ) : grades.rows.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t("empty")}</p>
            ) : isMobile ? (
              <GradesCards grades={grades} />
            ) : (
              <GradesTable grades={grades} />
            )}
          </>
        )}
      </QueryState>
    </div>
  )
}
