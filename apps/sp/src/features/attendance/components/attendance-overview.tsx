"use client"

import { getMeLessonResultsQuery, getMeTimetableQuery, type StudentAttendance } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, cn } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { countStates, type MarkedState } from "../utils/lesson-states"
import { monthRange } from "../utils/month-grid"
import { STATE_TONE } from "../utils/state-tone"
import { AttendanceSummary } from "./attendance-summary"

/**
 * The attendance counts under the calendar: the month shown (present, late, absent from the lessons of the month) and
 * the semester (absences, excused and lessons of the current term), with the summary per subject.
 */
export function AttendanceOverview({ data, month }: { data: StudentAttendance; month: string }) {
  const t = useT("attendance")
  const ta = useT("attendanceStates")
  const f = useFormatters()
  const range = monthRange(month)
  const lessons = useQuery(getMeTimetableQuery(range)).data
  const results = useQuery(getMeLessonResultsQuery(range)).data
  const counts = useMemo(() => countStates(lessons ?? [], results ?? []), [lessons, results])
  const semester = useMemo(
    () =>
      data.summary.reduce(
        (sum, row) => ({
          absences: sum.absences + row.absences,
          excused: sum.excused + row.excused,
          lessons: sum.lessons + row.lessons,
        }),
        { absences: 0, excused: 0, lessons: 0 },
      ),
    [data.summary],
  )
  const monthName = f.date(`${month}-01`, { month: "long", year: "numeric" })

  return (
    <section aria-labelledby="attendance-overview" className="flex flex-col gap-3">
      <h2 id="attendance-overview" className="text-base font-semibold">
        {t("overviewTitle")}
      </h2>
      {data.not_taken > 0 ? (
        <Alert>
          <AlertDescription data-testid="not-taken">{t("notTaken", { count: data.not_taken })}</AlertDescription>
        </Alert>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-2 rounded-lg border p-3">
          <h3 className="text-sm font-medium">
            {t("thisMonth")} <span className="text-muted-foreground font-normal capitalize">{monthName}</span>
          </h3>
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            <CountItem state="absent" label={ta("absent")} value={counts.absent} />
            <CountItem state="late" label={ta("late")} value={counts.late} />
            <CountItem state="present" label={ta("present")} value={counts.present} />
          </ul>
        </div>
        <div className="flex flex-col gap-2 rounded-lg border p-3">
          <h3 className="text-sm font-medium">{t("semester")}</h3>
          <dl className="grid grid-cols-3 gap-2 text-center">
            <Figure label={t("semesterAbsences")} value={semester.absences} />
            <Figure label={t("semesterExcused")} value={semester.excused} />
            <Figure label={t("semesterLessons")} value={semester.lessons} />
          </dl>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">{t("summaryTitle")}</h3>
        {data.summary.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("noSummary")}</p>
        ) : (
          <AttendanceSummary summary={data.summary} />
        )}
      </div>
    </section>
  )
}

function CountItem({ state, label, value }: { state: MarkedState; label: string; value: number }) {
  return (
    <li className="flex items-center gap-1.5">
      <span aria-hidden className={cn("size-2.5 rounded-full", STATE_TONE[state].dot)} />
      <span>{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </li>
  )
}

function Figure({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  )
}
