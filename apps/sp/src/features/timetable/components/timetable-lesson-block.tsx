"use client"

import type { LessonResult, StudentLessonItem } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, Icons, MarkBadge, cn } from "@ihsp/ui"
import Link from "next/link"
import { STATE_TONE } from "../../attendance/utils/state-tone"
import { describeChanges } from "../../shared/utils/describe-changes"
import { isLessonNow } from "../../shared/utils/period-times"
import { fullName, shortName } from "../../shared/utils/people"
import { subgroupsOf } from "../utils/week"

/**
 * One lesson on the calendar: subject, time, room and teacher; the attendance colour of the block (absent dark red,
 * late dark orange, present green); cancelled lessons are struck through, changed lessons show what changed. The block
 * fills its slot on the time grid, so its position and height come from the lesson's start and end.
 */
export function TimetableLessonBlock({
  lesson,
  now,
  showSubgroup = false,
  result,
}: {
  /** `subgroup.is_own_subgroup === false`: the other subgroup's lesson, shown dimmed and labelled. */
  lesson: StudentLessonItem
  now: number
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
  const otherSubgroup = lesson.subgroup?.is_own_subgroup === false ? lesson.subgroup : null
  const subgroups = showSubgroup ? subgroupsOf(lesson) : []
  const started = Date.parse(lesson.starts_at) < now
  const shown = started && !cancelled ? result : undefined
  const attendance = shown?.attendance ?? null
  const place = [
    lesson.room?.name ? t("room", { name: lesson.room.name }) : null,
    lesson.teacher ? shortName(lesson.teacher) : null,
  ]
  // The full subject, time, room and teacher: the tooltip for a block narrowed by an overlapping lesson.
  const details = [
    otherSubgroup ? t("otherSubgroup", { name: otherSubgroup.subgroup_name }) : null,
    lesson.subject.name,
    `${f.time(lesson.starts_at)}–${f.time(lesson.ends_at)}`,
    lesson.room?.name ? t("room", { name: lesson.room.name }) : null,
    lesson.teacher ? fullName(lesson.teacher) : null,
  ]

  return (
    <Link
      href={`/lessons/view/?id=${encodeURIComponent(lesson.id)}`}
      title={details.filter(Boolean).join(" · ")}
      data-current={current}
      data-cancelled={cancelled}
      data-attendance={attendance ?? undefined}
      data-other-subgroup={otherSubgroup ? true : undefined}
      className={cn(
        "hover:bg-accent focus-visible:ring-ring flex h-full min-w-0 flex-col gap-0.5 overflow-hidden rounded-md border p-1.5 text-xs leading-tight outline-none focus-visible:ring-2",
        attendance ? STATE_TONE[attendance].block : "bg-card",
        current && "border-primary ring-primary ring-1",
        cancelled && "opacity-60",
        otherSubgroup && "border-dashed opacity-60",
      )}
    >
      <span className="flex min-w-0 items-start justify-between gap-1">
        <span className={cn("line-clamp-2 min-w-0 font-medium break-words", cancelled && "line-through")}>
          {lesson.subject.name}
        </span>
        {attendance === "present" ? (
          <Icons.check
            className="size-3.5 shrink-0 text-green-600 dark:text-green-400"
            role="img"
            aria-label={ta("present")}
          />
        ) : null}
      </span>
      <span className="text-muted-foreground tabular-nums">
        {f.time(lesson.starts_at)}–{f.time(lesson.ends_at)}
      </span>
      {place.some(Boolean) ? (
        <span className="text-muted-foreground truncate">{place.filter(Boolean).join(" · ")}</span>
      ) : null}
      {!cancelled
        ? changes.map((change) => (
            <span key={change.field} className="truncate text-amber-700 dark:text-amber-400">
              {t.has(`fields.${change.field}`) ? t(`fields.${change.field}`) : change.field}: {change.from} →{" "}
              {change.to}
            </span>
          ))
        : null}
      <span
        className="mt-auto flex flex-wrap items-center gap-1 pt-0.5"
        data-testid={shown && (shown.attendance !== null || shown.mark !== null) ? "lesson-result" : undefined}
      >
        {attendance === "absent" ? (
          <span className="flex items-center gap-0.5 font-semibold" role="img" aria-label={ta("absent")}>
            <Icons.close className="size-3.5" aria-hidden />
            {ta("absent")}
          </span>
        ) : null}
        {attendance === "late" ? (
          <span className="flex items-center gap-0.5 font-semibold" role="img" aria-label={ta("late")}>
            <Icons.clock className="size-3.5" aria-hidden />
            {ta("late")}
          </span>
        ) : null}
        {shown && shown.mark !== null ? <MarkBadge mark={shown.mark} size="sm" /> : null}
        {cancelled ? <Badge variant="destructive">{t("cancelled")}</Badge> : null}
        {current ? <Badge>{t("now")}</Badge> : null}
        {otherSubgroup ? (
          <Badge variant="outline">{t("otherSubgroup", { name: otherSubgroup.subgroup_name })}</Badge>
        ) : null}
        {subgroups.map((number) => (
          <Badge key={number} variant="outline">
            {t("subgroup", { number })}
          </Badge>
        ))}
      </span>
    </Link>
  )
}
