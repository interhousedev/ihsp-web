"use client"

import type { StaffToday } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, Timeline, type TimelineItem } from "@ihsp/ui"
import { useAudienceLabel } from "../../shared/hooks/use-audience-label"
import { useNow } from "../../shared/hooks/use-now"
import { isLessonNow, lessonHref } from "../../shared/utils/lesson-time"
import { TodayCard } from "./today-card"

type TodayLesson = StaffToday["lessons"][number]

function stateOf(lesson: TodayLesson, now: number): NonNullable<TimelineItem["state"]> {
  if (lesson.status === "cancelled") return "cancelled"
  if (isLessonNow(lesson, now)) return "current"
  return Date.parse(lesson.ends_at) < now ? "past" : "upcoming"
}

/** Today's lessons with badges: attendance missing, no homework yet, changed, cancelled (STF-2). */
export function TodayLessonsCard({ lessons }: { lessons: TodayLesson[] }) {
  const t = useT("today.lessons")
  const f = useFormatters()
  const now = useNow()
  const audienceLabel = useAudienceLabel()

  const items: TimelineItem[] = lessons.map((lesson) => {
    const cancelled = lesson.status === "cancelled"
    return {
      id: lesson.id,
      time: f.time(lesson.starts_at),
      title: lesson.subject.name,
      subtitle: [audienceLabel(lesson.audience), lesson.room?.name].filter(Boolean).join(" · "),
      meta: (
        <>
          {cancelled ? <Badge variant="destructive">{t("cancelled")}</Badge> : null}
          {!cancelled && lesson.is_overridden ? <Badge variant="secondary">{t("changed")}</Badge> : null}
          {!cancelled && lesson.attendance_missing ? (
            <Badge variant="destructive">{t("attendanceMissing")}</Badge>
          ) : null}
          {!cancelled && lesson.homework_missing ? <Badge variant="outline">{t("homeworkMissing")}</Badge> : null}
        </>
      ),
      state: stateOf(lesson, now),
      href: lessonHref(lesson.id),
    }
  })

  return (
    <TodayCard title={t("title")} className="md:col-span-2">
      {items.length === 0 ? <p className="text-muted-foreground text-sm">{t("empty")}</p> : <Timeline items={items} />}
    </TodayCard>
  )
}
