"use client"

import type { LessonItem } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, Icons } from "@ihsp/ui"
import Link from "next/link"
import { LinkButton } from "../../shared/components/link-button"
import { useAudienceLabel } from "../../shared/hooks/use-audience-label"
import { useNow } from "../../shared/hooks/use-now"
import { isLessonNow, lessonHref } from "../../shared/utils/lesson-time"
import { TodayCard } from "./today-card"

/**
 * Now / Next lesson (STF-2, UF-STF-02): subject, audience, room and time, with the quick actions Attendance,
 * Homework and Add material. They open the lesson page at the right section.
 */
export function NowNextCard({ lesson }: { lesson: LessonItem | null }) {
  const t = useT("today.now")
  const f = useFormatters()
  const now = useNow()
  const audienceLabel = useAudienceLabel()

  if (!lesson) {
    return (
      <TodayCard title={t("title")}>
        <p className="text-sm">{t("none")}</p>
      </TodayCard>
    )
  }

  const running = isLessonNow(lesson, now)
  const cancelled = lesson.status === "cancelled"
  const details = [
    `${f.time(lesson.starts_at)}–${f.time(lesson.ends_at)}`,
    audienceLabel(lesson.audience),
    lesson.room?.name ? t("room", { name: lesson.room.name }) : null,
  ].filter(Boolean)

  return (
    <TodayCard title={running ? t("titleNow") : t("titleNext")}>
      <Link
        href={lessonHref(lesson.id)}
        className="hover:bg-accent focus-visible:ring-ring -mx-2 flex min-h-11 flex-col gap-1 rounded-lg px-2 py-1 outline-none focus-visible:ring-2"
      >
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-lg font-semibold">{lesson.subject.name}</span>
          {running ? (
            <Badge>
              <Icons.clock aria-hidden />
              {t("running")}
            </Badge>
          ) : null}
          {cancelled ? <Badge variant="destructive">{t("cancelled")}</Badge> : null}
        </span>
        <span className="text-muted-foreground text-sm">{details.join(" · ")}</span>
      </Link>
      {!cancelled ? (
        <div className="flex flex-wrap gap-2 pt-1">
          <LinkButton href={lessonHref(lesson.id, "attendance")} variant="default">
            <Icons.attendance aria-hidden />
            {t("attendance")}
          </LinkButton>
          <LinkButton href={lessonHref(lesson.id, "homework")}>
            <Icons.homework aria-hidden />
            {t("homework")}
          </LinkButton>
          <LinkButton href={lessonHref(lesson.id, "materials", "material")}>
            <Icons.add aria-hidden />
            {t("addMaterial")}
          </LinkButton>
        </div>
      ) : null}
    </TodayCard>
  )
}
