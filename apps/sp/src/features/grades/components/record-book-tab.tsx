"use client"

import { useT } from "@ihsp/i18n"
import { MarkBadge, Skeleton, Stat } from "@ihsp/ui"
import { lazy, Suspense } from "react"
import { QueryState } from "../../shared/components/query-state"
import { useRecordBook } from "../hooks/use-grades"

/** Recharts arrives in its own chunk when the tab shows a book; a box of the chart's height holds its place. */
const GpaChart = lazy(() => import("./gpa-chart"))

/** The record book (WEB-15, UF-WEB-11): a GPA line across semesters and the marks of every semester. */
export function RecordBookTab() {
  const t = useT("grades.record")
  const query = useRecordBook()
  return (
    <QueryState query={query} isEmpty={(book) => book.semesters.length === 0} emptyText={t("empty")} rows={4}>
      {(book) => (
        <div className="flex flex-col gap-6">
          <section aria-labelledby="record-chart" className="flex flex-col gap-2">
            <h2 id="record-chart" className="text-base font-semibold">
              {t("chartTitle")}
            </h2>
            <Suspense fallback={<Skeleton className="h-56 w-full" />}>
              <GpaChart book={book} />
            </Suspense>
            <ul className="grid grid-cols-2 gap-2 md:grid-cols-4" aria-label={t("gpaList")}>
              {book.semesters.map((semester) => (
                <li key={semester.semester} data-testid="record-semester-gpa">
                  <Stat
                    label={t("semesterLabel", { number: semester.semester })}
                    value={semester.gpa === null ? "–" : semester.gpa.toFixed(2)}
                  />
                </li>
              ))}
            </ul>
          </section>
          {book.semesters.map((semester) => (
            <section
              key={semester.semester}
              aria-labelledby={`record-semester-${semester.semester}`}
              className="flex flex-col gap-2"
            >
              <h3 id={`record-semester-${semester.semester}`} className="text-base font-semibold">
                {t("semesterLabel", { number: semester.semester })}
              </h3>
              <ul className="flex flex-col divide-y rounded-lg border">
                {semester.subjects.map((item) => (
                  <li key={item.subject.id} className="flex min-h-11 items-center gap-3 px-3 py-2">
                    <span className="min-w-0 flex-1 text-sm">{item.subject.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {t("emisRating")}: {item.emis_rating ?? "–"}
                    </span>
                    <MarkBadge mark={item.semester_mark} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </QueryState>
  )
}
