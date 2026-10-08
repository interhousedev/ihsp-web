"use client"

import type { LessonItem } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge } from "@ihsp/ui"
import { useAudienceLabel } from "../hooks/use-audience-label"
import { describeChanges } from "../utils/describe-changes"
import { fullName } from "../utils/people"

/**
 * The top of the lesson page (STF-4): when, the audience, the room (name only: the room page with its PIN is sent by
 * the bot, ROOM-3) and what changed in the timetable. Administration also sees the subject and the teacher
 * (`withTeacher`): a teacher knows whose lesson it is.
 */
export function LessonHeader({ lesson, withTeacher = false }: { lesson: LessonItem; withTeacher?: boolean }) {
  const t = useT("lessonDetail.header")
  const f = useFormatters()
  const audienceLabel = useAudienceLabel()
  const changes = describeChanges(lesson.changes)

  return (
    <div className="flex flex-col gap-2">
      <p className="text-muted-foreground text-sm">
        {f.date(lesson.date, { weekday: "long", day: "numeric", month: "long" })} ·{" "}
        {t("period", { number: lesson.period })} · {f.time(lesson.starts_at)}–{f.time(lesson.ends_at)}
      </p>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        {withTeacher ? (
          <>
            <div className="flex gap-2">
              <dt className="text-muted-foreground">{t("fields.subject")}</dt>
              <dd className="font-medium">{lesson.subject.name}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground">{t("fields.teacher")}</dt>
              <dd className="font-medium">
                {lesson.teacher ? fullName(lesson.teacher) : <Badge variant="destructive">{t("teacherNeeded")}</Badge>}
              </dd>
            </div>
          </>
        ) : null}
        <div className="flex gap-2">
          <dt className="text-muted-foreground">{t("audience")}</dt>
          <dd className="font-medium">{audienceLabel(lesson.audience)}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-muted-foreground">{t("room")}</dt>
          <dd className="font-medium">{lesson.room?.name ?? t("noRoom")}</dd>
        </div>
      </dl>
      <div className="flex flex-wrap gap-1.5">
        {lesson.status === "cancelled" ? <Badge variant="destructive">{t("cancelled")}</Badge> : null}
        {lesson.status !== "cancelled" && lesson.is_overridden ? (
          <Badge variant="secondary">{t("changed")}</Badge>
        ) : null}
      </div>
      {lesson.status !== "cancelled"
        ? changes.map((change) => (
            <p key={change.field} className="text-xs text-amber-700 dark:text-amber-400">
              {t.has(`fields.${change.field}`) ? t(`fields.${change.field}`) : change.field}: {change.from} →{" "}
              {change.to}
            </p>
          ))
        : null}
    </div>
  )
}
