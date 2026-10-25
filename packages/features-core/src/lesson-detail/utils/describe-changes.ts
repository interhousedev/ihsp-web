import type { LessonItem } from "@ihsp/api"

export type LessonChange = { field: string; from: string; to: string }

function labelOf(value: unknown): string {
  if (value === null || value === undefined) return "–"
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value)
  if (typeof value === "object") {
    const record = value as Record<string, unknown>
    if (typeof record.name === "string") return record.name
    if (typeof record.short_name === "string") return record.short_name
    if (typeof record.last_name === "string") {
      return [record.last_name, record.first_name].filter((part) => typeof part === "string").join(" ")
    }
  }
  return "–"
}

/** `{room: [{name: "204"}, {name: "310"}]}` becomes `[{field: "room", from: "204", to: "310"}]`. */
export function describeChanges(changes: LessonItem["changes"]): LessonChange[] {
  if (!changes) return []
  return Object.entries(changes).map(([field, pair]) => {
    const [from, to] = Array.isArray(pair) ? pair : [null, null]
    return { field, from: labelOf(from), to: labelOf(to) }
  })
}
