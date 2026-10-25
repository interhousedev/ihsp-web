"use client"

import type { StudentAttendance } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, StateView } from "@ihsp/ui"
import Link from "next/link"
import { shortName } from "../../shared/utils/people"

/** Every missed lesson with date, subject and teacher; each opens the lesson (UF-WEB-12 step 4). */
export function MissedLessons({ missed }: { missed: StudentAttendance["missed"] }) {
  const t = useT("attendance.missed")
  const f = useFormatters()
  if (missed.length === 0) return <StateView state="empty" emptyText={t("empty")} />
  const sorted = missed.toSorted((a, b) => b.lesson.starts_at.localeCompare(a.lesson.starts_at))

  return (
    <ul className="flex flex-col gap-2">
      {sorted.map(({ lesson, excused }) => (
        <li key={lesson.id}>
          <Link
            href={`/lessons/view/?id=${encodeURIComponent(lesson.id)}`}
            className="hover:bg-accent focus-visible:ring-ring flex min-h-14 flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border p-3 outline-none focus-visible:ring-2"
          >
            <span className="text-muted-foreground w-24 shrink-0 text-xs tabular-nums">
              {f.date(lesson.date, { weekday: "short", day: "numeric", month: "short" })}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{lesson.subject.name}</span>
              {lesson.teacher ? (
                <span className="text-muted-foreground block text-xs">{shortName(lesson.teacher)}</span>
              ) : null}
            </span>
            {excused ? (
              <Badge variant="outline">{t("excused")}</Badge>
            ) : (
              <Badge variant="destructive">{t("absent")}</Badge>
            )}
          </Link>
        </li>
      ))}
    </ul>
  )
}
