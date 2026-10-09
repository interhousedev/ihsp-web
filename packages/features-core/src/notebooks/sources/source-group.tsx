"use client"

import type { SourceItem, SourceKind } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@ihsp/ui"
import { IconChevronDown } from "@tabler/icons-react"
import type { ReactNode } from "react"
import { isUsable, selectionState } from "../lib/sort-sources"
import { CombineNotesMenu } from "./combine-notes-menu"
import { SelectionCheckbox } from "./selection-checkbox"

type SourceGroupProps = {
  kind: SourceKind
  sources: readonly SourceItem[]
  /** Toggles every usable source of the group. */
  onToggleGroup: (sources: readonly SourceItem[], selected: boolean) => void
  children: ReactNode
}

/**
 * A collapsible group of the Sources panel: kind name, count and a checkbox that toggles the whole group. The Notes
 * group also has a ⋯ menu to combine the selected notes.
 */
export function SourceGroup({ kind, sources, onToggleGroup, children }: SourceGroupProps) {
  const t = useT("notebooks")
  const state = selectionState(sources)
  const name = t(`group.${kind === "web_result" ? "url" : kind}`)
  return (
    <Collapsible defaultOpen className="flex flex-col">
      <div className="flex items-center">
        <CollapsibleTrigger className="text-muted-foreground hover:text-foreground focus-visible:ring-ring group/trigger flex min-h-11 min-w-0 flex-1 items-center gap-1 rounded-lg px-2 text-start text-xs font-medium tracking-wide uppercase outline-hidden focus-visible:ring-2 md:min-h-8">
          <IconChevronDown
            aria-hidden
            className="size-4 shrink-0 -rotate-90 transition-transform group-data-panel-open/trigger:rotate-0 motion-reduce:transition-none"
          />
          <span className="truncate">{name}</span>
          <span className="tabular-nums">{`(${sources.length})`}</span>
        </CollapsibleTrigger>
        {kind === "note" ? <CombineNotesMenu name={name} /> : null}
        <SelectionCheckbox
          aria-label={t("sources.selectGroup", { group: name })}
          checked={state === "all"}
          indeterminate={state === "some"}
          disabled={!sources.some(isUsable)}
          onCheckedChange={(selected) => onToggleGroup(sources, selected)}
        />
      </div>
      <CollapsibleContent>
        <ul className="flex flex-col gap-0.5">{children}</ul>
      </CollapsibleContent>
    </Collapsible>
  )
}
