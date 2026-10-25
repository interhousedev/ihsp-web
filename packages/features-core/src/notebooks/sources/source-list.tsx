"use client"

import type { SourceItem } from "@ihsp/api"
import type { ReactNode } from "react"
import { groupSources } from "../lib/sort-sources"
import type { TopicGroupData } from "../lib/topic-groups"
import { SourceGroup } from "./source-group"
import { TopicGroup } from "./topic-group"

/** How the sources are listed: groups by kind, groups by topic label, or one list. */
export type TopicLayout = { notebookId: string; groups: readonly TopicGroupData[]; readOnly: boolean }

type SourceListProps = {
  sources: readonly SourceItem[]
  /** One list ordered by position instead of groups by kind. */
  flat: boolean
  /** Groups by topic label instead (wins over `flat`). */
  topics?: TopicLayout
  renderRow: (source: SourceItem) => ReactNode
  /** Toggles every usable source of a group. */
  onToggleGroup: (sources: readonly SourceItem[], selected: boolean) => void
}

/** The sources as one flat list or as collapsible groups by kind or by topic. */
export function SourceList({ sources, flat, topics, renderRow, onToggleGroup }: SourceListProps) {
  if (sources.length === 0) return null
  if (topics) {
    return (
      <div className="flex flex-col gap-2">
        {topics.groups.map((group) => (
          <TopicGroup
            key={group.label?.id ?? "none"}
            notebookId={topics.notebookId}
            group={group}
            readOnly={topics.readOnly}
            onToggleGroup={onToggleGroup}
            renderRow={renderRow}
          />
        ))}
      </div>
    )
  }
  if (flat) {
    return (
      <ul className="flex flex-col gap-0.5">{sources.toSorted((a, b) => a.position - b.position).map(renderRow)}</ul>
    )
  }
  return (
    <div className="flex flex-col gap-2">
      {groupSources(sources).map((group) => (
        <SourceGroup key={group.kind} kind={group.kind} sources={group.sources} onToggleGroup={onToggleGroup}>
          {group.sources.map(renderRow)}
        </SourceGroup>
      ))}
    </div>
  )
}
