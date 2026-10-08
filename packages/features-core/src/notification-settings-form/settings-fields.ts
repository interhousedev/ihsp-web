import type { UserPreferences } from "@ihsp/api"

export const MARK_TYPES = ["lesson", "midterm", "final"] as const
export const MARK_VALUES = [2, 3, 4, 5] as const

/** Adds or removes `value`, keeping the order of `all`. */
export function toggleInList<T>(current: readonly T[], value: T, all: readonly T[]): T[] {
  const next = new Set(current)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  return all.filter((item) => next.has(item))
}

/**
 * Subject filter of mark notifications: `null` means every subject. Switching one subject off turns `null` into the
 * list of all the others; switching everything on again gives `null` back.
 */
export function nextSubjectIds(
  current: UserPreferences["marks_subject_ids"],
  allIds: readonly string[],
  id: string,
): string[] | null {
  const selected = new Set(current ?? allIds)
  if (selected.has(id)) selected.delete(id)
  else selected.add(id)
  const next = allIds.filter((item) => selected.has(item))
  return next.length === allIds.length ? null : next
}

/** A threshold from an input: empty or out of range gives `undefined` (keep the old value). */
export function parseThreshold(text: string, min: number, max: number): number | undefined {
  const value = Number(text.replace(",", "."))
  if (text.trim() === "" || Number.isNaN(value) || value < min || value > max) return undefined
  return value
}
