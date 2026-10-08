"use client"

import type { StudentToday } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, Timeline, type TimelineItem } from "@ihsp/ui"
import { shortName } from "../../shared/utils/people"
import { TodayCard } from "./today-card"

const STATE_MAP: Record<StudentToday["lessons"][number]["state"], NonNullable<TimelineItem["state"]>> = {
  done: "past",
  now: "current",
  next: "upcoming",
  later: "upcoming",
  cancelled: "cancelled",
}

/** Today's lessons as a timeline: done dimmed, the current one highlighted, cancelled struck through (WEB-3). */
export function TimelineCard({ today }: { today: StudentToday }) {
  const t = useT("today.timeline")
  const f = useFormatters()

  const items: TimelineItem[] = today.lessons.map((lesson) => ({
    id: lesson.id,
    time: f.time(lesson.starts_at),
    title: lesson.subject.name,
    subtitle: [lesson.room?.name, lesson.teacher ? shortName(lesson.teacher) : null].filter(Boolean).join(" · "),
    meta: (
      <>
        {lesson.state === "cancelled" ? <Badge variant="destructive">{t("cancelled")}</Badge> : null}
        {lesson.state !== "cancelled" && lesson.is_overridden ? (
          <Badge variant="secondary">{t("changed")}</Badge>
        ) : null}
        {lesson.has_homework ? <Badge variant="outline">{t("homework")}</Badge> : null}
      </>
    ),
    state: STATE_MAP[lesson.state],
    href: `/lessons/view/?id=${encodeURIComponent(lesson.id)}`,
  }))

  return (
    <TodayCard title={t("title")} className="md:col-span-2">
      <Timeline items={items} />
    </TodayCard>
  )
}
