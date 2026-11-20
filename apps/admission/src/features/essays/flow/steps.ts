/** The six steps of the essays flow, in the order a student walks them. */
export const FLOW_STEP_IDS = ["map", "practice", "ideas", "gallery", "deep", "match"] as const
export type FlowStepId = (typeof FLOW_STEP_IDS)[number]

export function isFlowStep(value: string | null): value is FlowStepId {
  return FLOW_STEP_IDS.includes(value as FlowStepId)
}

/** The step an old `?tab=` address meant; the tab maze is gone but its links keep working. */
export const LEGACY_TABS: Record<string, FlowStepId> = {
  essays: "ideas",
  colleges: "map",
  ideas: "ideas",
  story: "ideas",
  examples: "gallery",
  alignment: "deep",
}

/** The step the address points at; `?step=` first, then a legacy `?tab=`, else the first step. */
export function stepFromParams(step: string | null, tab: string | null): FlowStepId {
  if (isFlowStep(step)) return step
  return (tab ? LEGACY_TABS[tab] : undefined) ?? "map"
}

/** An idea stalls the flow when there are fewer than three, or none fits any open prompt well. */
export const STALL_IDEAS = 3
export const STALL_SCORE = 40

export function ideasStall(ideas: number, bestScore: number | null): boolean {
  return ideas < STALL_IDEAS || (bestScore !== null && bestScore < STALL_SCORE)
}
