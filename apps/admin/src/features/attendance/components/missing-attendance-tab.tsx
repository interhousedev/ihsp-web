"use client"

import { getAdminAttendanceMissing } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { parseAsString, useQueryStates } from "nuqs"
import { QueryState } from "../../shared/components/query-state"
import { audienceLabel, fullName } from "../../shared/utils/names"
import { DateRangeFields } from "./date-range-fields"

/**
 * Teachers with lessons whose attendance was never submitted (UF-ADM-09 step 3). Old attendance is corrected on the
 * lesson page of this console, which each lesson links to.
 */
export function MissingAttendanceTab() {
  const t = useT("attendance.missing")
  const f = useFormatters()
  const [range, setRange] = useQueryStates({ from: parseAsString, to: parseAsString })
  const params = { from: range.from ?? undefined, to: range.to ?? undefined }
  const query = useQuery({
    queryKey: ["admin", "attendance", "missing", params],
    queryFn: ({ signal }) => getAdminAttendanceMissing(params, { signal }),
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <DateRangeFields from={range.from} to={range.to} onChange={(from, to) => void setRange({ from, to })} />
      </div>
      <QueryState query={query} rows={3} isEmpty={(items) => items.length === 0} emptyText={t("none")}>
        {(items) => (
          <div className="grid gap-4 lg:grid-cols-2">
            {items.map((item) => (
              <Card key={item.teacher.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2">
                    <Link
                      href={`/teachers/view/?id=${encodeURIComponent(item.teacher.id)}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {fullName(item.teacher)}
                    </Link>
                    <Badge variant="destructive">{t("count", { count: item.lessons.length })}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="flex flex-col divide-y text-sm">
                    {item.lessons.map((lesson) => (
                      <li key={lesson.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                        <span>
                          {f.date(lesson.date, { weekday: "short", day: "numeric", month: "short" })} · {lesson.period}.{" "}
                          {lesson.subject.name}
                          <span className="text-muted-foreground"> · {audienceLabel(lesson.audience)}</span>
                        </span>
                        <Link
                          href={`/lessons/view/?id=${encodeURIComponent(lesson.id)}`}
                          className="inline-flex min-h-11 items-center underline-offset-4 hover:underline md:min-h-8"
                        >
                          {t("openLesson")}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </QueryState>
    </div>
  )
}
