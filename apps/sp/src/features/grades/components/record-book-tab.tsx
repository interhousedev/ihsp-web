"use client"

import type { RecordBook } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { ChartContainer, ChartTooltip, ChartTooltipContent, MarkBadge, Stat, type ChartConfig } from "@ihsp/ui"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { QueryState } from "../../shared/components/query-state"
import { useRecordBook } from "../hooks/use-grades"

function GpaChart({ book }: { book: RecordBook }) {
  const t = useT("grades.record")
  const config = { gpa: { label: t("gpa"), color: "var(--chart-1)" } } satisfies ChartConfig
  const data = book.semesters.map((semester) => ({
    semester: t("semesterShort", { number: semester.semester }),
    gpa: semester.gpa,
  }))
  return (
    <ChartContainer config={config} className="h-56 w-full" role="img" aria-label={t("chartLabel")}>
      <LineChart data={data} margin={{ left: 0, right: 12, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="semester" tickLine={false} axisLine={false} />
        <YAxis domain={[2, 5]} tickCount={4} width={28} tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line dataKey="gpa" type="monotone" stroke="var(--color-gpa)" strokeWidth={2} dot connectNulls />
      </LineChart>
    </ChartContainer>
  )
}

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
            <GpaChart book={book} />
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
