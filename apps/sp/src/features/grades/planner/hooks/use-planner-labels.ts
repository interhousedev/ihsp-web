"use client"

import type { PlannerAssumption, PlannerMarkType, PlannerTargetStatus } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { useMemo } from "react"

/** The words of the planner that depend on a code of the answer (a kind of mark, a target status, an assumption). */
export type PlannerLabels = {
  /** "Lessons", "Midterm", "Final": the heading of an average. */
  type: (type: PlannerMarkType) => string
  /** "Lesson", "Midterm", "Final": one mark that is tried out. */
  tryType: (type: PlannerMarkType) => string
  /** "Final not yet" */
  missing: (type: PlannerMarkType) => string
  /** "Secured", "Needs marks", "Out of reach", "Not known yet" */
  status: (status: PlannerTargetStatus) => string
  /** One line for each assumption code. */
  assumption: (code: PlannerAssumption) => string
}

export function usePlannerLabels(): PlannerLabels {
  const t = useT("planner")
  return useMemo(() => {
    const types = { lesson: t("type.lesson"), midterm: t("type.midterm"), final: t("type.final") }
    const tryTypes = {
      lesson: t("whatIf.types.lesson"),
      midterm: t("whatIf.types.midterm"),
      final: t("whatIf.types.final"),
    }
    const missing = {
      lesson: t("summary.missing.lesson"),
      midterm: t("summary.missing.midterm"),
      final: t("summary.missing.final"),
    }
    const statuses = {
      secured: t("target.status.secured"),
      needed: t("target.status.needed"),
      not_reachable: t("target.status.not_reachable"),
      unknown: t("target.status.unknown"),
    }
    const assumptions = {
      rounding: t("assumptions.rounding"),
      controls_per_semester: t("assumptions.controls_per_semester"),
      same_mark_on_remaining: t("assumptions.same_mark_on_remaining"),
      pending_as_lesson_average: t("assumptions.pending_as_lesson_average"),
      no_lesson_marks: t("assumptions.no_lesson_marks"),
      what_if: t("assumptions.what_if"),
    }
    return {
      type: (type) => types[type],
      tryType: (type) => tryTypes[type],
      missing: (type) => missing[type],
      status: (status) => statuses[status],
      assumption: (code) => assumptions[code],
    }
  }, [t])
}
