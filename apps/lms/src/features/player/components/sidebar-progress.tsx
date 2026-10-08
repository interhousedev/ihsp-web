"use client"

import { useFormatters, useT } from "@ihsp/i18n"
import { Progress } from "@ihsp/ui"
import { formatPoints, type CourseProgress } from "../../shared/utils/course-progress"

/** "Course progress: 12/514" (points) with the bar under it, at the top of the course sidebar. */
export function SidebarProgress({ progress }: { progress: CourseProgress }) {
  const t = useT("player")
  const { locale } = useFormatters()
  const text =
    progress.kind === "points"
      ? t("courseProgressPoints", {
          earned: formatPoints(progress.earned, locale),
          total: formatPoints(progress.total, locale),
        })
      : t("courseProgressLessons", { done: progress.done, total: progress.total })
  return (
    <Progress value={progress.percent} aria-label={text} className="mt-2 gap-1.5">
      <span className="text-xs">{text}</span>
    </Progress>
  )
}
