import type { LabelItem, SourceItem } from "@ihsp/api"

/** The sources of one topic; `label` is `null` for the sources that have none. */
export type TopicGroupData = { label: LabelItem | null; sources: SourceItem[] }

/**
 * Groups sources by topic label, in label order. A source with several labels is listed under each of them; sources
 * with no label (or only a label that was deleted) come last under `label: null`. An empty topic is kept when
 * `keepEmpty` is set (so it can still be renamed or deleted) and left out otherwise (a search is filtering).
 */
export function groupByTopic(
  sources: readonly SourceItem[],
  labels: readonly LabelItem[],
  keepEmpty: boolean,
): TopicGroupData[] {
  const byPosition = (a: SourceItem, b: SourceItem) => a.position - b.position
  const known = new Set(labels.map((label) => label.id))
  const groups = labels
    .toSorted((a, b) => a.position - b.position)
    .map((label) => ({
      label,
      sources: sources.filter((source) => source.label_ids.includes(label.id)).toSorted(byPosition),
    }))
    .filter((group) => keepEmpty || group.sources.length > 0)
  const loose = sources.filter((source) => !source.label_ids.some((id) => known.has(id))).toSorted(byPosition)
  return loose.length > 0 ? [...groups, { label: null, sources: loose }] : groups
}
