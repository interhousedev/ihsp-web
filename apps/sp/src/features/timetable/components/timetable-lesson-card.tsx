"use client"

import type { LessonItem, LessonResult } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, Icons, MarkBadge, cn } from "@ihsp/ui"
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
  const attendance = shown?.attendance ?? null

  return (
    <Link
      href={`/lessons/view/?id=${encodeURIComponent(lesson.id)}`}
      data-current={current}
      data-cancelled={cancelled}
      className={cn(
        "hover:bg-accent focus-visible:ring-ring flex min-h-11 flex-col gap-0.5 rounded-lg border p-2 text-sm outline-none focus-visible:ring-2",
        current && "border-primary bg-primary/5",
        cancelled && "opacity-70",
        attendance === "absent" &&
          "border-red-800 bg-red-800/15 text-red-950 hover:bg-red-800/25 dark:border-red-500 dark:bg-red-950/60 dark:text-red-100 dark:hover:bg-red-950/80",
        attendance === "late" &&
          "border-orange-700 bg-orange-700/15 text-orange-950 hover:bg-orange-700/25 dark:border-orange-500 dark:bg-orange-950/60 dark:text-orange-100 dark:hover:bg-orange-950/80",
      )}
      data-attendance={attendance ?? undefined}
    >
      {showTime ? (
        <span className="text-muted-foreground text-xs tabular-nums">
          {t("period", { number: lesson.period })} · {f.time(lesson.starts_at)}–{f.time(lesson.ends_at)}
        </span>
      ) : null}
      <span className={cn("font-medium", cancelled && "line-through")}>{lesson.subject.name}</span>
      <span
        className={cn("text-muted-foreground text-xs", attendance && attendance !== "present" && "text-current/80")}
      >
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
          {attendance === "present" ? (
            <Icons.check className="size-4 text-green-600 dark:text-green-400" role="img" aria-label={ta("present")} />
          ) : null}
          {attendance === "absent" ? (
            <span className="flex items-center gap-1 text-xs font-semibold" role="img" aria-label={ta("absent")}>
              <Icons.close className="size-4" aria-hidden />
              {ta("absent")}
            </span>
          ) : null}
          {attendance === "late" ? (
            <span className="flex items-center gap-1 text-xs font-semibold" role="img" aria-label={ta("late")}>
              <Icons.clock className="size-4" aria-hidden />
              {ta("late")}
            </span>
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
