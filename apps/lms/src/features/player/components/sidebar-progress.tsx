"use client"

import { useFormatters, useT } from "@ihsp/i18n"
import { Progress } from "@ihsp/ui"
import { formatPoints, type CourseProgress } from "../../shared/utils/course-progress"

/** "Course progress: 2/3 lessons · 0/5" (lessons, then points) with the bar under it, at the top of the course sidebar. */
export function SidebarProgress({ progress }: { progress: CourseProgress }) {
  const t = useT("player")
  const { locale } = useFormatters()
  const text = t("courseProgressLessons", { done: progress.done, total: progress.total })
  const points = progress.points
    ? t("courseProgressPoints", {
        earned: formatPoints(progress.points.earned, locale),
        total: formatPoints(progress.points.total, locale),
      })
    : null
  const label = points ? `${text} · ${points}` : text
  return (
    <Progress value={progress.percent} aria-label={label} className="mt-2 gap-1.5">
      <span className="text-xs">{label}</span>
    </Progress>
  )
}
