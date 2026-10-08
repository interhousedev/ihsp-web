"use client"

import type { LessonItem } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, Icons, cn } from "@ihsp/ui"
import Link from "next/link"
import { useAudienceLabel } from "../../shared/hooks/use-audience-label"
import { describeChanges } from "../../shared/utils/describe-changes"
import { isAttendanceMissing, isLessonNow, lessonHref } from "../../shared/utils/lesson-time"

/**
 * One lesson of the timetable (STF-3): subject, audience, room; cancelled lessons are struck through, changed lessons
 * show what changed, the current lesson is highlighted and past lessons without attendance get a warning badge.
 */
export function TimetableLessonCard({
  lesson,
  now,
  showTime = false,
}: {
  lesson: LessonItem
  now: number
  /** Phone day list: the time range is part of the card (the grid has it in the row header). */
  showTime?: boolean
}) {
  const t = useT("timetable")
  const f = useFormatters()
  const audienceLabel = useAudienceLabel()
  const cancelled = lesson.status === "cancelled"
  const current = isLessonNow(lesson, now)
  const missing = isAttendanceMissing(lesson, now)
  const changes = describeChanges(lesson.changes)

  return (
    <Link
      href={lessonHref(lesson.id)}
      data-current={current}
      data-cancelled={cancelled}
      className={cn(
        "hover:bg-accent focus-visible:ring-ring flex min-h-11 flex-col gap-0.5 rounded-lg border p-2 text-sm outline-none focus-visible:ring-2",
        current && "border-primary bg-primary/5",
        missing && "border-destructive/50",
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
        {[audienceLabel(lesson.audience), lesson.room?.name ? t("room", { name: lesson.room.name }) : null]
          .filter(Boolean)
          .join(" · ")}
      </span>
      {lesson.topic ? <span className="text-muted-foreground line-clamp-2 text-xs">{lesson.topic}</span> : null}
      <span className="flex flex-wrap gap-1">
        {cancelled ? <Badge variant="destructive">{t("cancelled")}</Badge> : null}
        {current ? <Badge>{t("now")}</Badge> : null}
        {missing ? (
          <Badge variant="destructive">
            <Icons.warning aria-hidden />
            {t("attendanceMissing")}
          </Badge>
        ) : null}
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
