import { JOURNEY, type ActConfig, type MilestoneConfig } from "./config"

/** What the journey reads: readiness component scores by key (0..100) and whether the preferences quiz is complete. */
export type JourneyData = {
  scores: Readonly<Record<string, number>>
  preferencesCompleted: boolean
}

export type MilestoneState = "done" | "current" | "locked"

export type Milestone = MilestoneConfig & {
  state: MilestoneState
  /** Own progress 0..100 (the readiness score; the quiz is 0 or 100). */
  percent: number
  /** Position across the whole journey, 0-based. */
  index: number
}

export type Act = {
  key: ActConfig["key"]
  milestones: Milestone[]
  doneCount: number
  /** The act holding the current milestone. */
  active: boolean
}

export type Journey = {
  acts: Act[]
  total: number
  done: number
  current: Milestone | null
  /** The act of the current milestone, or the last act when everything is done. */
  currentAct: Act
  /** The current milestone and the ones after it, for the next-up panel. */
  upNext: Milestone[]
}

function percentOf(m: MilestoneConfig, data: JourneyData): number {
  if (m.source.kind === "preferences") return data.preferencesCompleted ? 100 : 0
  const raw = data.scores[m.source.component] ?? 0
  return Math.max(0, Math.min(100, Math.round(raw)))
}

/** Done = 100%; the first unfinished milestone is current, every later one is locked. */
export function deriveJourney(data: JourneyData, config: readonly ActConfig[] = JOURNEY): Journey {
  let index = 0
  let current: Milestone | null = null
  const flat: Milestone[] = []
  const acts: Act[] = config.map((act) => {
    const milestones = act.milestones.map((m): Milestone => {
      const percent = percentOf(m, data)
      let state: MilestoneState
      if (percent >= 100) state = "done"
      else if (current === null) state = "current"
      else state = "locked"
      const built: Milestone = { ...m, state, percent, index: index++ }
      if (state === "current") current = built
      flat.push(built)
      return built
    })
    return { key: act.key, milestones, doneCount: milestones.filter((m) => m.state === "done").length, active: false }
  })
  const cur = current as Milestone | null
  const currentAct = acts.find((a) => a.milestones.some((m) => m.state === "current")) ?? acts[acts.length - 1]
  if (cur) currentAct.active = true
  return {
    acts,
    total: flat.length,
    done: flat.filter((m) => m.state === "done").length,
    current: cur,
    currentAct,
    upNext: flat.filter((m) => m.state !== "done").slice(0, 3),
  }
}
