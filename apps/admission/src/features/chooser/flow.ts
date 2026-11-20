import { useSession } from "@ihsp/auth"
import { useCallback, useSyncExternalStore } from "react"

/** The steps of "Universities and budget", top to bottom. */
export const FLOW_STEPS = ["quiz", "match", "list", "budget", "brief"] as const
export type FlowStepId = (typeof FLOW_STEPS)[number]

/** Entries that make a list worth a budget and a brief: a few of each kind, not one. */
export const LIST_TARGET = 4

export type FlowFacts = { quizDone: boolean; entries: number; budgetViewed: boolean }

export type FlowStep = {
  id: FlowStepId
  /** 1-based, shown in the stepper. */
  number: number
  done: boolean
  /** An earlier step is not done yet. */
  locked: boolean
  /** The earlier step that keeps this one locked, and how many entries it still lacks (for the list steps). */
  blockedBy?: FlowStepId
  missing?: number
}

export function isFlowStep(value: string | null | undefined): value is FlowStepId {
  return (FLOW_STEPS as readonly string[]).includes(value ?? "")
}

/**
 * The state of every step from the data alone: the quiz is done when it is completed, the pick when the list has an
 * entry, the list from {@link LIST_TARGET} entries, the budget once it has been viewed. A step opens only when all
 * before it are done. `current` is the first step not done; `open` the one the address asks for if it is open, else `current`.
 */
export function deriveFlow(facts: FlowFacts, requested: string | null | undefined) {
  const done: Record<FlowStepId, boolean> = {
    quiz: facts.quizDone,
    match: facts.entries >= 1,
    list: facts.entries >= LIST_TARGET,
    budget: facts.budgetViewed,
    brief: false,
  }
  const steps: FlowStep[] = FLOW_STEPS.map((id, index) => {
    const blocker = FLOW_STEPS.slice(0, index).find((earlier) => !done[earlier])
    const missing =
      blocker === "match" ? 1 - facts.entries : blocker === "list" ? LIST_TARGET - facts.entries : undefined
    return {
      id,
      number: index + 1,
      done: done[id],
      locked: blocker !== undefined,
      blockedBy: blocker,
      missing: missing !== undefined && missing > 0 ? missing : undefined,
    }
  })
  const current = steps.find((step) => !step.done) ?? steps[steps.length - 1]
  const asked = isFlowStep(requested) ? steps.find((step) => step.id === requested) : undefined
  const open = asked && !asked.locked ? asked : current
  return { steps, current: current.id, open: open.id }
}

/** Per user, so two accounts sharing a browser keep their own flag. */
export const budgetViewedKey = (userId: string) => `ihsp:admission:budget-viewed:${userId}`
const listeners = new Set<() => void>()

/**
 * Whether the student has seen the budget. The backend keeps no such flag, so it lives in this browser only
 * (localStorage, one key per user); a new browser asks for one more look, which costs nothing.
 */
export function useBudgetViewed() {
  const { session } = useSession()
  const userId = session?.user.id
  const viewed = useSyncExternalStore(
    (notify) => {
      listeners.add(notify)
      window.addEventListener("storage", notify)
      return () => {
        listeners.delete(notify)
        window.removeEventListener("storage", notify)
      }
    },
    () => {
      if (!userId) return false
      try {
        return window.localStorage.getItem(budgetViewedKey(userId)) === "1"
      } catch {
        return false
      }
    },
    () => false,
  )
  const markViewed = useCallback(() => {
    if (!userId) return
    try {
      window.localStorage.setItem(budgetViewedKey(userId), "1")
    } catch {
      return
    }
    listeners.forEach((notify) => notify())
  }, [userId])
  return { viewed, markViewed }
}
