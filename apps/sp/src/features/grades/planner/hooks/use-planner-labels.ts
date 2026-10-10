"use client"

import type { PlannerMarkType, PlannerTargetStatus } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { useMemo } from "react"

/** The words of the planner that depend on a code of the answer (a kind of mark, a target status). */
export type PlannerLabels = {
  /** "Lessons", "Midterm", "Final": the heading of an average. */
  type: (type: PlannerMarkType) => string
  /** "Lesson", "Midterm", "Final": one mark that is tried out. */
  tryType: (type: PlannerMarkType) => string
  /** "Final not yet" */
  missing: (type: PlannerMarkType) => string
  /** "Secured", "Needs marks", "Out of reach", "Not known yet" */
  status: (status: PlannerTargetStatus) => string
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
    return {
      type: (type) => types[type],
      tryType: (type) => tryTypes[type],
      missing: (type) => missing[type],
      status: (status) => statuses[status],
    }
  }, [t])
}
