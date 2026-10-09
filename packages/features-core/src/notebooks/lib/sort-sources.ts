import type { SourceItem, SourceKind } from "@ihsp/api"

/** The order of the groups in the Sources panel (docs/reference/notebooklm.md § 5.4.2). */
export const SOURCE_GROUP_ORDER: readonly SourceKind[] = [
  "file",
  "chat",
  "lesson_resource",
  "flashcard_set",
  "lms_step",
  "note",
  "text",
  "url",
  "web_result",
]

export type SourceGroup = { kind: SourceKind; sources: SourceItem[] }

/** Groups by kind in the fixed order; inside a group sources keep their `position`. Empty groups are omitted. */
export function groupSources(sources: readonly SourceItem[]): SourceGroup[] {
  const byKind = new Map<SourceKind, SourceItem[]>()
  for (const source of sources) {
    const list = byKind.get(source.kind) ?? []
    list.push(source)
    byKind.set(source.kind, list)
  }
  return SOURCE_GROUP_ORDER.flatMap((kind) => {
    const list = byKind.get(kind)
    return list ? [{ kind, sources: list.toSorted((a, b) => a.position - b.position) }] : []
  })
}

export type SelectionState = "all" | "some" | "none"

/** Only sources that can be used for answers (`ready` and `stale`) take part in the selection state. */
export function isUsable(source: SourceItem): boolean {
  return source.status === "ready" || source.status === "stale"
}

export function selectionState(sources: readonly SourceItem[]): SelectionState {
  const usable = sources.filter(isUsable)
  if (usable.length === 0) return "none"
  const selected = usable.filter((source) => source.selected).length
  if (selected === 0) return "none"
  return selected === usable.length ? "all" : "some"
}

/** Whether the list is short enough to be shown flat (one kind, fewer than 5 sources). */
export function canShowFlat(sources: readonly SourceItem[]): boolean {
  return new Set(sources.map((source) => source.kind)).size <= 1 && sources.length < 5
}

/** Whether any source is still being read (the panel polls every 2 s while this is true). */
export function hasPendingSources(sources: readonly SourceItem[] | undefined): boolean {
  return (sources ?? []).some((source) => source.status === "pending" || source.status === "processing")
}
