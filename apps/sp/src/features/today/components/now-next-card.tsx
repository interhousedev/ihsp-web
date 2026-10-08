"use client"

import type { StudentToday } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, Icons } from "@ihsp/ui"
import Link from "next/link"
import { useNow } from "../../shared/hooks/use-now"
import { shortName } from "../../shared/utils/people"
import { remainingMinutes } from "../utils/countdown"
import { TodayCard } from "./today-card"

/** Now / Next lesson (WEB-3): subject, time left, room, teacher and materials count; opens the lesson. */
export function NowNextCard({ today, loadedAt }: { today: StudentToday; loadedAt: number }) {
  const t = useT("today.now")
  const f = useFormatters()
  const now = useNow()
  const lesson = today.now_or_next

  if (!lesson) {
    return (
      <TodayCard title={t("title")}>
        <p className="text-sm">{t("none")}</p>
        {today.next_study_day ? (
          <p className="text-muted-foreground text-sm">
            {t("nextStudyDay", {
              date: f.date(today.next_study_day, { weekday: "long", day: "numeric", month: "long" }),
            })}
          </p>
        ) : null}
      </TodayCard>
    )
  }

  const running = today.lessons.find((item) => item.id === lesson.id)?.state === "now"
  const minutes = lesson.minutes_left === null ? null : remainingMinutes(lesson.minutes_left, loadedAt, now)
  const countdown =
    minutes === null ? null : running ? t("minutesLeft", { count: minutes }) : t("startsIn", { count: minutes })
  const details = [
    `${f.time(lesson.starts_at)}–${f.time(lesson.ends_at)}`,
    lesson.room?.name ? t("room", { name: lesson.room.name }) : null,
    lesson.teacher ? shortName(lesson.teacher) : null,
    t("materials", { count: lesson.materials_count }),
  ].filter(Boolean)

  return (
    <TodayCard title={running ? t("titleNow") : t("titleNext")}>
      <Link
        href={`/lessons/view/?id=${encodeURIComponent(lesson.id)}`}
        className="hover:bg-accent focus-visible:ring-ring -mx-2 flex min-h-11 flex-col gap-1 rounded-lg px-2 py-1 outline-none focus-visible:ring-2"
      >
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-lg font-semibold">{lesson.subject.name}</span>
          {countdown ? (
            <Badge variant={running ? "default" : "secondary"}>
              <Icons.clock aria-hidden />
              {countdown}
            </Badge>
          ) : null}
        </span>
        <span className="text-muted-foreground text-sm">{details.join(" · ")}</span>
      </Link>
    </TodayCard>
  )
}
