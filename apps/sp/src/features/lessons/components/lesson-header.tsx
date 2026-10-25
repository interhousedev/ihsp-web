"use client"

import type { LessonItem } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge } from "@ihsp/ui"
import { fullName } from "../../shared/utils/people"

/** Subject, date, period, time, room, teacher and topic of the lesson (WEB-9, UF-WEB-06). */
export function LessonHeader({ lesson }: { lesson: LessonItem }) {
  const t = useT("lesson")
  const f = useFormatters()
  const rows = [
    [t("date"), f.date(lesson.date, { weekday: "long", day: "numeric", month: "long" })],
    [t("time"), `${t("period", { number: lesson.period })} · ${f.time(lesson.starts_at)}–${f.time(lesson.ends_at)}`],
    [t("room"), lesson.room?.name ?? "–"],
    [t("teacher"), lesson.teacher ? fullName(lesson.teacher) : "–"],
    [t("topic"), lesson.topic ?? "–"],
  ] as const

  return (
    <div className="flex flex-col gap-2">
      {lesson.status === "cancelled" ? (
        <Badge variant="destructive" className="w-fit">
          {t("cancelled")}
        </Badge>
      ) : null}
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="min-w-0 break-words">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
