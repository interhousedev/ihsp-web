"use client"

import type { LessonItem, LessonResult } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, MarkBadge, cn } from "@ihsp/ui"
import Link from "next/link"
import { describeChanges } from "../../shared/utils/describe-changes"
import { isLessonNow } from "../../shared/utils/period-times"
import { shortName } from "../../shared/utils/people"
import { subgroupsOf } from "../utils/week"

/**
 * One lesson of the timetable (WEB-5): subject, room, teacher; cancelled lessons are struck through, changed lessons
 * show what changed ("Room 204 → 310"), the current lesson is highlighted. Opens the lesson page.
 */
export function TimetableLessonCard({
  lesson,
  now,
  showTime = false,
  showSubgroup = false,
  result,
}: {
  lesson: LessonItem
  now: number
  /** Phone day list: the time range is part of the card (the grid has it in the row header). */
  showTime?: boolean
  /** The student has no subgroup, so lessons of both subgroups are listed and marked (UF-WEB-03 1a). */
  showSubgroup?: boolean
  /** Attendance and mark; shown only for lessons that started before `now`. */
  result?: LessonResult
}) {
  const t = useT("timetable")
  const ta = useT("attendanceStates")
  const f = useFormatters()
  const cancelled = lesson.status === "cancelled"
  const current = isLessonNow(lesson, now)
  const changes = describeChanges(lesson.changes)
  const subgroups = showSubgroup ? subgroupsOf(lesson) : []
  const started = Date.parse(lesson.starts_at) < now
  const shown = started && !cancelled ? result : undefined

  return (
    <Link
      href={`/lessons/view/?id=${encodeURIComponent(lesson.id)}`}
      data-current={current}
      data-cancelled={cancelled}
      className={cn(
        "hover:bg-accent focus-visible:ring-ring flex min-h-11 flex-col gap-0.5 rounded-lg border p-2 text-sm outline-none focus-visible:ring-2",
        current && "border-primary bg-primary/5",
        cancelled && "opacity-70",
      )}
    >
      {showTime ? (
        <span className="text-muted-foreground text-xs tabular-nums">
          {t("period", { number: lesson.period })} · {f.time(lesson.starts_at)}–{f.time(lesson.ends_at)}
        </span>
      ) : null}
      <span className={cn("font-medium", cancelled && "line-through")}>{lesson.subject.name}</span>
      <span className="text-muted-foreground text-xs">
        {[
          lesson.room?.name ? t("room", { name: lesson.room.name }) : null,
          lesson.teacher ? shortName(lesson.teacher) : null,
        ]
          .filter(Boolean)
          .join(" · ")}
      </span>
      {lesson.topic ? <span className="text-muted-foreground line-clamp-2 text-xs">{lesson.topic}</span> : null}
      {shown && (shown.attendance !== null || shown.mark !== null) ? (
        <span className="flex items-center gap-2" data-testid="lesson-result">
          {shown.attendance === "present" ? (
            <span className="size-2.5 rounded-full bg-green-600" role="img" aria-label={ta("present")} />
          ) : null}
          {shown.attendance === "absent" ? (
            <span className="size-2.5 rounded-full bg-red-600" role="img" aria-label={ta("absent")} />
          ) : null}
          {shown.attendance === "late" ? (
            <span className="size-2.5 rounded-full bg-amber-500" role="img" aria-label={ta("late")} />
          ) : null}
          {shown.mark !== null ? <MarkBadge mark={shown.mark} size="sm" /> : null}
        </span>
      ) : null}
      <span className="flex flex-wrap gap-1">
        {cancelled ? <Badge variant="destructive">{t("cancelled")}</Badge> : null}
        {current ? <Badge>{t("now")}</Badge> : null}
        {subgroups.map((number) => (
          <Badge key={number} variant="outline">
            {t("subgroup", { number })}
          </Badge>
        ))}
      </span>
      {!cancelled
        ? changes.map((change) => (
            <span key={change.field} className="text-xs text-amber-700 dark:text-amber-400">
              {t.has(`fields.${change.field}`) ? t(`fields.${change.field}`) : change.field}: {change.from} →{" "}
              {change.to}
            </span>
          ))
        : null}
    </Link>
  )
}
