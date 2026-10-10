"use client"

import type { SourceItem, SourceKind } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@ihsp/ui"
import { IconChevronDown } from "@ihsp/ui"
import type { ReactNode } from "react"
import { isUsable, selectionState } from "../lib/sort-sources"
import { CombineNotesMenu } from "./combine-notes-menu"
import { SelectionCheckbox } from "./selection-checkbox"

type SourceGroupProps = {
  /** The kind of a group by type; its name and the Notes menu follow from it. Absent in a topic group. */
  kind?: SourceKind
  /** The title of a topic group (emoji and name); a group by type is named after its kind. */
  name?: string
  /** The ⋯ menu of a topic group. */
  menu?: ReactNode
  /** While a topic is renamed in place, the field that takes the place of the title. */
  renaming?: ReactNode
  sources: readonly SourceItem[]
  /** Toggles every usable source of the group. */
  onToggleGroup: (sources: readonly SourceItem[], selected: boolean) => void
  children: ReactNode
}

/**
 * A collapsible group of the Sources panel: kind name (or topic emoji and name), count and a checkbox that toggles the
 * whole group. The Notes group also has a ⋯ menu to combine the selected notes; a topic group has one to rename or
 * delete the label.
 */
export function SourceGroup({
  kind,
  name: topicName,
  menu,
  renaming,
  sources,
  onToggleGroup,
  children,
}: SourceGroupProps) {
  const t = useT("notebooks")
  const state = selectionState(sources)
  const name = topicName ?? (kind ? t(`group.${kind === "web_result" ? "url" : kind}`) : "")
  return (
    <Collapsible defaultOpen className="flex flex-col">
      <div className="flex items-center">
        {renaming ?? (
          <CollapsibleTrigger className="text-muted-foreground hover:text-foreground focus-visible:ring-ring group/trigger flex min-h-11 min-w-0 flex-1 items-center gap-1 rounded-lg px-2 text-start text-xs font-medium tracking-wide uppercase outline-hidden focus-visible:ring-2 md:min-h-8">
            <IconChevronDown
              aria-hidden
              className="size-4 shrink-0 -rotate-90 transition-transform group-data-panel-open/trigger:rotate-0 motion-reduce:transition-none"
            />
            <span className="truncate">{name}</span>
            <span className="tabular-nums">{`(${sources.length})`}</span>
          </CollapsibleTrigger>
        )}
        {kind === "note" ? <CombineNotesMenu name={name} /> : null}
        {menu}
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
