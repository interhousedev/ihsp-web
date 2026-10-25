"use client"

import type { StepView } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { formatPoints } from "../../shared/utils/course-progress"

/**
 * The line under the top bar, like Stepik's: the lesson number and title, then "2 out of 16 steps passed" and
 * "0 out of 28 points received". The points are left out for a lesson without tests.
 */
export function LessonHeader({ number, step }: { number: string | null; step: StepView }) {
  const t = useT("player")
  const { locale } = useFormatters()
  return (
    <div className="border-b px-4 py-3 md:px-6">
      <h1 className="text-base leading-snug font-medium break-words">
        {number ? <span className="text-muted-foreground me-2 tabular-nums">{number}</span> : null}
        {step.title}
      </h1>
      <p className="text-muted-foreground mt-0.5 flex flex-wrap gap-x-4 text-sm">
        <span>{t("stepsPassed", { passed: step.blocks_passed, total: step.blocks_total })}</span>
        {step.points_total > 0 ? (
          <span>
            {t("pointsReceived", {
              earned: formatPoints(step.points_earned, locale),
              total: formatPoints(step.points_total, locale),
            })}
          </span>
        ) : null}
      </p>
    </div>
  )
}
