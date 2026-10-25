"use client"

import { isApiError, type GroupProgress } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { SemesterSwitcher, Skeleton } from "@ihsp/ui"
import { keepPreviousData, useQuery, type UseQueryOptions } from "@tanstack/react-query"
import { useState } from "react"
import { cellOf, formatMark, formatPercent } from "./format"
import { ProgressCell } from "./progress-cell"
import { StudentProgressSheet } from "./student-progress-sheet"

export type GroupProgressSectionProps = {
  /** Query for the group's progress in a semester (`undefined` is the current one). */
  queryFor: (semester?: number) => { queryKey: readonly unknown[]; queryFn: UseQueryOptions<GroupProgress>["queryFn"] }
  /** Heading level text; defaults to "Marks & attendance". */
  title?: string
}

/** Students × subjects: marks and attendance of a group, a semester picker and a student sheet. Read-only. */
export function GroupProgressSection({ queryFor, title }: GroupProgressSectionProps) {
  const t = useT("groupProgress")
  const [semester, setSemester] = useState<number | undefined>(undefined)
  const [openId, setOpenId] = useState<string | null>(null)
  const query = useQuery({
    ...(queryFor(semester) as UseQueryOptions<GroupProgress>),
    placeholderData: keepPreviousData,
  })

  if (query.isError) {
    const forbidden = isApiError(query.error) && query.error.status === 403
    return (
      <p role="alert" className="text-muted-foreground text-sm">
        {forbidden ? t("notAllowed") : t("error")}
      </p>
    )
  }
  const data = query.data
  if (!data) return <Skeleton className="h-40 w-full" />
  const current = semester ?? data.semester ?? data.semesters[data.semesters.length - 1]
  const opened = data.students.find((row) => row.student.id === openId) ?? null

  return (
    <section aria-label={title ?? t("title")} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold">{title ?? t("title")}</h2>
        {data.semesters.length > 0 && current !== undefined ? (
          <SemesterSwitcher
            value={current}
            onChange={setSemester}
            semesters={data.semesters.map((value) => ({ value }))}
          />
        ) : null}
      </div>
      {data.students.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("empty")}</p>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-left text-xs">
                  <th className="px-2 py-2 font-medium">{t("student")}</th>
                  {data.subjects.map((subject) => (
                    <th key={subject.id} className="px-2 py-2 font-medium" title={subject.name}>
                      {subject.short_name}
                    </th>
                  ))}
                  <th className="px-2 py-2 font-medium">{t("gpa")}</th>
                </tr>
              </thead>
              <tbody>
                {data.students.map((row) => (
                  <tr key={row.student.id} className="border-b align-top">
                    <th scope="row" className="px-2 py-2 text-left font-medium">
                      <button
                        type="button"
                        className="min-h-11 text-left underline-offset-2 hover:underline"
                        onClick={() => setOpenId(row.student.id)}
                      >
                        {row.student.last_name} {row.student.first_name}
                      </button>
                    </th>
                    {data.subjects.map((subject) => (
                      <td key={subject.id} className="px-2 py-2">
                        <ProgressCell cell={cellOf(row, subject.id)} />
                      </td>
                    ))}
                    <td className="px-2 py-2 tabular-nums">
                      <span className="font-semibold">{formatMark(row.gpa)}</span>
                      <span className="text-muted-foreground block text-xs">{formatPercent(row.absence_rate)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-2 md:hidden">
            {data.students.map((row) => (
              <div key={row.student.id}>
                <button
                  type="button"
                  className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border p-3 text-left"
                  onClick={() => setOpenId(row.student.id)}
                >
                  <span className="font-medium">
                    {row.student.last_name} {row.student.first_name}
                  </span>
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {t("gpa")} {formatMark(row.gpa)} · {formatPercent(row.absence_rate)}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </>
      )}
      <StudentProgressSheet student={opened} subjects={data.subjects} onClose={() => setOpenId(null)} />
    </section>
  )
}
