import type { EssaySummary } from "../api"
import type { MatchSlot, MatchTable } from "../flow/steps-api"

export const isPersonalSlot = (slot: MatchSlot) => slot.slot === "ps"
/** A short answer is typed in place; the server marks it with the `short_answer` category. */
export const isShortSlot = (slot: MatchSlot) => slot.category === "short_answer"
export const isSharedSlot = (slot: MatchSlot) => slot.shared

/** A slot counts as filled only when its essay fits the limit. */
export const isFilled = (slot: MatchSlot) =>
  isShortSlot(slot) ? (slot.short_answer?.word_count ?? 0) > 0 : slot.assigned !== null && !slot.assigned.over_limit

export const filledCount = (table: MatchTable) => table.slots.filter(isFilled).length

/** The first words of a prompt as a slot name ("Excited about learning…"); null when the slot has no prompt. */
export function promptHead(prompt: string | null, words = 7): string | null {
  const parts = (prompt ?? "").trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return null
  return parts.length > words ? `${parts.slice(0, words).join(" ")}…` : parts.join(" ")
}

/** Why an essay cannot go into a slot: too long for its limit, or not a personal statement for the Common App slot. */
export function blocker(slot: MatchSlot, essay: EssaySummary): "over" | "kind" | null {
  if (isPersonalSlot(slot) && essay.kind !== "personal_statement") return "kind"
  if (slot.word_limit !== null && essay.word_count > slot.word_limit) return "over"
  return null
}

/** The position a new essay for this slot answers (`supp:3` is the third prompt). */
export function slotPosition(slot: MatchSlot): number | null {
  const n = Number(slot.slot.split(":")[1])
  return Number.isFinite(n) ? n : null
}

/** Universities with something to write first (soonest deadline first, as the server sends them), the rest after. */
export function splitTables(tables: MatchTable[]): { active: MatchTable[]; empty: MatchTable[] } {
  return { active: tables.filter((t) => t.slots.length > 0), empty: tables.filter((t) => t.slots.length === 0) }
}
