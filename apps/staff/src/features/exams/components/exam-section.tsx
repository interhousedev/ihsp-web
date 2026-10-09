"use client"

import type { ControlPeriod } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { useId, type ReactNode } from "react"
import { usePeriodLabel } from "../hooks/use-period-label"
import type { ExamSection as Section } from "../utils/controls"

/** One control week of the list (Midterm 1, Midterm 2, Final or Other) with its days and the controls in it. */
export function ExamSection({
  section,
  period,
  children,
}: {
  section: Section
  period?: ControlPeriod
  children: ReactNode
}) {
  const t = useT("exams")
  const periodLabel = usePeriodLabel()
  const headingId = useId()
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline gap-x-3">
        <h2 id={headingId} className="text-base font-semibold">
          {t(`controls.${section}`)}
        </h2>
        {period ? <span className="text-muted-foreground text-sm">{periodLabel(period)}</span> : null}
      </div>
      <ul className="flex flex-col gap-2">{children}</ul>
    </section>
  )
}
