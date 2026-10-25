"use client"

import type { LessonItem } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Icons } from "@ihsp/ui"
import { LinkButton } from "../../shared/components/link-button"
import { useAudienceLabel } from "../../shared/hooks/use-audience-label"
import { lessonHref } from "../../shared/utils/lesson-time"
import { TodayCard } from "./today-card"

/** Needs attention (UF-STF-02 step 3): past lessons of the last 7 days without attendance, each with Take attendance. */
export function NeedsAttentionCard({ lessons }: { lessons: LessonItem[] }) {
  const t = useT("today.attention")
  const f = useFormatters()
  const audienceLabel = useAudienceLabel()

  return (
    <TodayCard title={t("title")}>
      {lessons.length === 0 ? (
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          <Icons.circleCheck className="text-primary size-4" aria-hidden />
          {t("none")}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {lessons.map((lesson) => (
            <li key={lesson.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{lesson.subject.name}</p>
                <p className="text-muted-foreground truncate text-xs">
                  {[
                    f.date(lesson.date, { weekday: "short", day: "numeric", month: "short" }),
                    t("period", { number: lesson.period }),
                    audienceLabel(lesson.audience),
                  ].join(" · ")}
                </p>
              </div>
              <LinkButton href={lessonHref(lesson.id, "attendance")}>{t("take")}</LinkButton>
            </li>
          ))}
        </ul>
      )}
    </TodayCard>
  )
}
