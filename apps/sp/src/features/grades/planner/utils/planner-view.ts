import type { PlannerControl, PlannerTarget, SubjectPlanner } from "@ihsp/api"

/** A mean as the backend rounded it (two places), or a dash when there is none. */
export function formatMean(value: number | null | undefined): string {
  return value === null || value === undefined ? "–" : value.toFixed(2)
}

/** What a target card says, decided from the answer without any arithmetic of its own. */
export type TargetView =
  | { kind: "secured" }
  | { kind: "not_reachable" }
  | { kind: "unknown" }
  /** One kind of control is left: the lowest mark each of the `count` remaining ones needs. */
  | { kind: "single"; control: PlannerControl; value: number; count: number }
  /** Both kinds are left: the lowest mark that works everywhere and the lowest final per midterm mark. */
  | { kind: "both"; minBoth: number | null; pairs: PlannerTarget["pairs"] }

export function targetView(target: PlannerTarget, remaining: SubjectPlanner["remaining"]): TargetView {
  if (target.status !== "needed") return { kind: target.status }
  if (target.control !== null && target.min_value !== null) {
    return { kind: "single", control: target.control, value: target.min_value, count: remaining[target.control] }
  }
  return { kind: "both", minBoth: target.min_both, pairs: target.pairs }
}

/** Which remaining controls the predicted mark assumed a mark for ("unknown": nothing to predict from). */
export function predictionKind(
  predicted: SubjectPlanner["predicted"],
): "both" | "midterm" | "final" | "none" | "unknown" {
  if (predicted.value === null) return "unknown"
  if (predicted.midterm !== null && predicted.final !== null) return "both"
  if (predicted.midterm !== null) return "midterm"
  if (predicted.final !== null) return "final"
  return "none"
}
