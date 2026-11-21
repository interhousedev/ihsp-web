import type { Ikigai, IkigaiCircle } from "./api"

export const CIRCLES = ["love", "good_at", "needs", "paid"] as const satisfies readonly IkigaiCircle[]
export const MAX_PICKS = 5
export const MAX_CHIPS = 8
export const MAX_CHIP_LENGTH = 60

export const EMPTY_IKIGAI: Ikigai = { love: [], good_at: [], needs: [], paid: [] }

/** Circle colours: theme tokens only. */
export const CIRCLE_COLOR: Record<IkigaiCircle, string> = {
  love: "var(--destructive)",
  good_at: "var(--primary)",
  needs: "var(--success)",
  paid: "var(--warning)",
}

/** Where the circles overlap: the four pairs the classic diagram names (passion, mission, vocation, profession). */
export const filledCount = (ikigai: Ikigai) => CIRCLES.filter((c) => ikigai[c].length > 0).length

/** Adds a pick (up to `MAX_PICKS`, no duplicates) at the end of the ranking. */
export function addPick(ids: readonly string[], id: string): string[] {
  if (ids.includes(id) || ids.length >= MAX_PICKS) return [...ids]
  return [...ids, id]
}

export const removePick = (ids: readonly string[], id: string) => ids.filter((x) => x !== id)

/** Share of tasks as a whole percent, for the one-line exposure note. */
export const exposurePct = (value: number) => Math.round(Math.min(1, Math.max(0, value)) * 100)
