"use client"

import type { LessonItem } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge } from "@ihsp/ui"
import Link from "next/link"
import { audienceLabel, fullName } from "../utils/names"

/** Lessons grouped by date: time, subject, teacher, room and audience, with badges for cancelled and changed. */
export function LessonList({ lessons, emptyText }: { lessons: readonly LessonItem[]; emptyText?: string }) {
  const t = useT("shared")
  const f = useFormatters()
  if (lessons.length === 0) return <p className="text-muted-foreground text-sm">{emptyText ?? t("noLessons")}</p>

  const byDate = new Map<string, LessonItem[]>()
  for (const lesson of [...lessons].toSorted((a, b) => a.starts_at.localeCompare(b.starts_at))) {
    byDate.set(lesson.date, [...(byDate.get(lesson.date) ?? []), lesson])
  }
  return (
    <div className="flex flex-col gap-4">
      {[...byDate.entries()].map(([date, items]) => (
        <section key={date} aria-label={f.date(date)} className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">{f.date(date, { weekday: "long", day: "numeric", month: "long" })}</h3>
          <ul className="flex flex-col divide-y rounded-lg border">
            {items.map((lesson) => (
              <li key={lesson.id} className="flex flex-col gap-1 p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">
                    {lesson.period}.{" "}
                    <Link
                      href={`/lessons/view/?id=${encodeURIComponent(lesson.id)}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {lesson.subject.name}
                    </Link>
                  </p>
                  <div className="flex gap-1">
                    {lesson.status === "cancelled" ? <Badge variant="destructive">{t("cancelled")}</Badge> : null}
                    {lesson.is_overridden && lesson.status !== "cancelled" ? (
                      <Badge variant="outline">{t("changed")}</Badge>
                    ) : null}
                    {lesson.teacher === null ? <Badge variant="destructive">{t("teacherNeeded")}</Badge> : null}
                  </div>
                </div>
                <p className="text-muted-foreground text-xs">
                  {[
                    `${f.time(lesson.starts_at)}–${f.time(lesson.ends_at)}`,
                    lesson.teacher ? fullName(lesson.teacher) : null,
                    lesson.room?.name,
                    audienceLabel(lesson.audience),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
