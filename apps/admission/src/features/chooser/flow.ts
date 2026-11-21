/** The stages of "Universities", left to right on the rail. The ids are the `?step=` values of the address. */
export const STAGES = ["quiz", "match", "list"] as const
export type StageId = (typeof STAGES)[number]

export type FlowFacts = { quizDone: boolean; entries: number }

export type Stage = {
  id: StageId
  /** 1-based, shown on the rail. */
  number: number
  done: boolean
  /** Locked only on the first run: the survey comes first, then matching, then a list that has something in it. */
  locked: boolean
}

export type Stages = { stages: Stage[]; landing: StageId; open: StageId }

/** Old addresses: the budget and the brief are part of the list now. */
const LEGACY: Record<string, StageId> = { budget: "list", brief: "list" }

export function stageFromParam(value: string | null | undefined): StageId | undefined {
  if (!value) return undefined
  const found = LEGACY[value] ?? value
  return (STAGES as readonly string[]).includes(found) ? (found as StageId) : undefined
}

/**
 * The state of the stages from the data alone. Linear once: matching waits for the survey and the list for a first
 * university; after that every stage is open, in any order. `landing` is where the student arrives: the survey while it
 * is open, matching while the list is empty, otherwise the list. `open` is the stage the address asks for when it is
 * open, else `landing`.
 */
export function deriveStages(facts: FlowFacts, requested: string | null | undefined): Stages {
  const done: Record<StageId, boolean> = { quiz: facts.quizDone, match: facts.entries >= 1, list: false }
  const locked: Record<StageId, boolean> = {
    quiz: false,
    match: !facts.quizDone,
    list: facts.entries === 0,
  }
  const stages: Stage[] = STAGES.map((id, index) => ({ id, number: index + 1, done: done[id], locked: locked[id] }))
  const landing: StageId = !facts.quizDone ? "quiz" : facts.entries === 0 ? "match" : "list"
  const asked = stageFromParam(requested)
  const open = asked && !locked[asked] ? asked : landing
  return { stages, landing, open }
}
