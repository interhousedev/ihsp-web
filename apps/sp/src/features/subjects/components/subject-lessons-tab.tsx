"use client"

import type { SubjectDetail } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { MarkBadge, StateView } from "@ihsp/ui"
import Link from "next/link"
import { AttendanceBadge } from "../../shared/components/attendance-badge"

/** Lessons of the subject, newest first, with topic, mark, attendance and homework (UF-WEB-05). */
export function SubjectLessonsTab({ detail }: { detail: SubjectDetail }) {
  const t = useT("subjects.lessons")
  const f = useFormatters()
  const lessons = detail.lessons.toSorted((a, b) => b.starts_at.localeCompare(a.starts_at))
  if (lessons.length === 0) return <StateView state="empty" emptyText={t("empty")} />

  return (
    <ul className="flex flex-col gap-2">
      {lessons.map((lesson) => (
        <li key={lesson.id}>
          <Link
            href={`/lessons/view/?id=${encodeURIComponent(lesson.id)}`}
            className="hover:bg-accent focus-visible:ring-ring flex min-h-14 flex-col gap-1 rounded-lg border p-3 outline-none focus-visible:ring-2"
          >
            <span className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium">
                {f.date(lesson.date, { weekday: "short", day: "numeric", month: "short" })} · {f.time(lesson.starts_at)}
              </span>
              <span className="flex items-center gap-2">
                {lesson.marks.map((mark, index) => (
                  <MarkBadge key={`${mark.type}-${index}`} mark={mark.value} size="sm" />
                ))}
                <AttendanceBadge state={lesson.attendance} />
              </span>
            </span>
            <span className="text-muted-foreground text-sm break-words">{lesson.topic ?? t("noTopic")}</span>
            {lesson.homework_text ? (
              <span className="text-xs break-words">
                <span className="font-medium">{t("homework")}:</span> {lesson.homework_text}
              </span>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  )
}
