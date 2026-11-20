import type { PromptGroup } from "./api"

/** The universities of a prompt group in one line: the first three, then "+N". */
export function groupLabel(group: PromptGroup): string {
  const names = [...new Set(group.prompts.map((p) => p.institution_name))]
  const shown = names.slice(0, 3).join(" · ")
  return names.length > 3 ? `${shown} +${names.length - 3}` : shown
}

/** The most words one essay may have to fit every prompt of the group; null when none of them is limited. */
export function groupWordLimit(group: PromptGroup): number | null {
  const limits = group.prompts.flatMap((p) => (p.word_limit && p.limit_unit === "words" ? [p.word_limit] : []))
  return limits.length ? Math.min(...limits) : null
}
