import type { AgentStep } from "@ihsp/api"

/** A step event: a new step is appended, an update of a known one (same `id`) replaces it in place. */
export function upsertStep(steps: readonly AgentStep[], step: AgentStep): AgentStep[] {
  const index = steps.findIndex((current) => current.id === step.id)
  if (index === -1) return [...steps, step]
  return steps.map((current, at) => (at === index ? step : current))
}

/** The latest step that has not finished, shown as the collapsed line while the answer is written. */
export function runningStep(steps: readonly AgentStep[]): AgentStep | undefined {
  return steps.findLast((step) => step.status === "running")
}
