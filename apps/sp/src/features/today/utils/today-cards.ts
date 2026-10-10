/** The Today cards (WEB-3) in their default order; `UserPreferences.today_cards` lists the visible ones in order. */
export const TODAY_CARD_IDS = ["now", "timeline", "due", "marks", "semester", "announcements", "alerts"] as const

export type TodayCardId = (typeof TODAY_CARD_IDS)[number]

export function isTodayCardId(value: string): value is TodayCardId {
  return (TODAY_CARD_IDS as readonly string[]).includes(value)
}

/** Known cards of the preference in their saved order; unknown ids and duplicates are dropped. */
export function visibleTodayCards(saved: readonly string[]): TodayCardId[] {
  const seen = new Set<TodayCardId>()
  for (const id of saved) if (isTodayCardId(id)) seen.add(id)
  return [...seen]
}

/** All cards for the Settings editor: the visible ones first in saved order, then the hidden ones in default order. */
export function allTodayCards(saved: readonly string[]): { id: TodayCardId; visible: boolean }[] {
  const visible = visibleTodayCards(saved)
  const hidden = TODAY_CARD_IDS.filter((id) => !visible.includes(id))
  return [...visible.map((id) => ({ id, visible: true })), ...hidden.map((id) => ({ id, visible: false }))]
}

/** Moves the card at `index` one place up or down (no change at the ends). */
export function moveCard<T>(cards: readonly T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction
  if (target < 0 || target >= cards.length) return [...cards]
  const next = [...cards]
  const moved = next[index]
  const other = next[target]
  if (moved === undefined || other === undefined) return next
  next[index] = other
  next[target] = moved
  return next
}
