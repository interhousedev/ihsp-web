import type { PlannerMarkType } from "@ihsp/api"

/** A mark the student tries out: not received, not saved, only sent to the planner. */
export type WhatIfMark = { type: PlannerMarkType; value: number }

/** The marks of the scale, best first (the order of the mark select). */
export const WHAT_IF_MARKS = [5, 4, 3, 2] as const

/** The planner takes at most this many what-if marks per request. */
export const MAX_WHAT_IF = 20

export const WHAT_IF_TYPES: PlannerMarkType[] = ["lesson", "midterm", "final"]

/** `what_if=<type>:<value>` values of the planner request, in the order the marks were added. */
export function formatWhatIf(marks: WhatIfMark[]): string[] {
  return marks.map((mark) => `${mark.type}:${mark.value}`)
}
