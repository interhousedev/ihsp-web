"use client"

import type { AssessmentItem } from "@ihsp/api"
import { todayIso, useFormatters, useT } from "@ihsp/i18n"
import { useMemo } from "react"
import { controlKeyOf } from "../utils/control-key"
import { countdownOf, isWeekRunning } from "../utils/countdown"
import { formatPeriod } from "../utils/period"

/** The words of an exam as the pages show them: its name, its countdown and where in time it is. */
export type ExamLabels = {
  /** "Midterm 1", "Final" … */
  control: (item: AssessmentItem) => string
  /** "Midterm 1 · Mathematics" */
  name: (item: AssessmentItem) => string
  /** "in 7 days", "tomorrow", "3 days ago", "this week" */
  countdown: (item: AssessmentItem) => string
  /** "12–17 Oct" */
  period: (period: { start: string; end: string }) => string
  /** "Wed, 14 Oct · 09:00", or "Control week 12–17 Oct" while no date is set. */
  when: (item: AssessmentItem) => string
}

export function useExamLabels(): ExamLabels {
  const t = useT("exams")
  const f = useFormatters()
  return useMemo(() => {
    const kinds = {
      midterm1: t("kind.midterm1"),
      midterm2: t("kind.midterm2"),
      midterm: t("kind.midterm"),
      final: t("kind.final"),
      other: t("kind.other"),
    }
    const control = (item: AssessmentItem) => kinds[controlKeyOf(item)]
    const period = (value: { start: string; end: string }) =>
      formatPeriod(value, (date, options) => f.date(date, options))
    return {
      control,
      name: (item) => t("name", { control: control(item), subject: item.subject.name }),
      countdown: (item) => {
        if (isWeekRunning(item, todayIso())) return t("countdown.weekRunning")
        const countdown = countdownOf(item.days_left)
        switch (countdown.kind) {
          case "today":
            return t("countdown.today")
          case "tomorrow":
            return t("countdown.tomorrow")
          case "yesterday":
            return t("countdown.yesterday")
          case "in":
            return t("countdown.in", { count: countdown.days })
          case "ago":
            return t("countdown.ago", { count: countdown.days })
        }
      },
      period,
      when: (item) => {
        if (!item.has_date) return item.period ? t("row.week", { range: period(item.period) }) : ""
        const day = f.date(item.date, { weekday: "short", day: "numeric", month: "short" })
        return item.starts_at ? `${day} · ${f.time(item.starts_at)}` : day
      },
    }
  }, [t, f])
}
