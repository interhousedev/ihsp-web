"use client"

import type { SourceItem } from "@ihsp/api"
import type { ReactNode } from "react"
import { groupSources } from "../lib/sort-sources"
import { SourceGroup } from "./source-group"

type SourceListProps = {
  sources: readonly SourceItem[]
  /** One list ordered by position instead of groups by kind. */
  flat: boolean
  renderRow: (source: SourceItem) => ReactNode
  /** Toggles every usable source of a group. */
  onToggleGroup: (sources: readonly SourceItem[], selected: boolean) => void
}

/** The sources as one flat list or as collapsible groups by kind. */
export function SourceList({ sources, flat, renderRow, onToggleGroup }: SourceListProps) {
  if (sources.length === 0) return null
  if (flat) {
    return <ul className="flex flex-col gap-0.5">{sources.toSorted((a, b) => a.position - b.position).map(renderRow)}</ul>
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
