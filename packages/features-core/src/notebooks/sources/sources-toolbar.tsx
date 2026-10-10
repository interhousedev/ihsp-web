"use client"

import { useT } from "@ihsp/i18n"
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@ihsp/ui"
import {
  IconCategory,
  IconList,
  IconLoader2,
  IconRefresh,
  IconSearch,
  IconTag,
  IconTagStarred,
} from "@ihsp/ui"
import type { RefObject } from "react"
import type { SelectionState } from "../lib/sort-sources"
import { SelectionCheckbox } from "./selection-checkbox"

/** The search button: it opens the title search field under the toolbar. */
export type SearchToggle = {
  open: boolean
  onToggle: () => void
  /** Gets the focus back when the field closes. */
  buttonRef: RefObject<HTMLButtonElement | null>
}

/** How the list is grouped once the notebook has topic labels. */
export type GroupBy = "type" | "topic" | "none"

/** The "Group by" menu (Type, Topic, None) that replaces the flat toggle when the notebook has topic labels. */
export type GroupByControl = { value: GroupBy; onChange: (value: GroupBy) => void }

/** The "Auto-label" button: labels the selected, ready sources by topic in the background. */
export type AutoLabelControl = {
  busy: boolean
  /** No selected, ready source: nothing to label. */
  disabled: boolean
  onStart: () => void
}

type SourcesToolbarProps = {
  selection: SelectionState
  hasStale: boolean
  /** At least one source can be used for answers (a ready or outdated one). */
  hasUsable: boolean
  syncing: boolean
  /** The list is short enough to be flat (one kind, fewer than 5 sources); otherwise there is no toggle. */
  canFlat: boolean
  flat: boolean
  search: SearchToggle
  /** Absent for read-only course staff. */
  autoLabel?: AutoLabelControl
  groupBy?: GroupByControl
  onSyncAll: () => void
  onToggleAll: (selected: boolean) => void
  onToggleFlat: () => void
}

/**
 * Auto-label, sync outdated, search, grouped / flat toggle (a Group by menu with topic labels) and the tri-state
 * "Select all sources" checkbox.
 */
export function SourcesToolbar({
  selection,
  hasStale,
  hasUsable,
  syncing,
  canFlat,
  flat,
  search,
  autoLabel,
  groupBy,
  onSyncAll,
  onToggleAll,
  onToggleFlat,
}: SourcesToolbarProps) {
  const t = useT("notebooks")
  return (
    <div className="flex items-center gap-1 px-3 md:px-4">
      {autoLabel ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 md:size-8"
          aria-label={autoLabel.busy ? t("sources.autoLabeling") : t("sources.autoLabel")}
          title={autoLabel.disabled && !autoLabel.busy ? t("sources.autoLabelNeedsSelection") : t("sources.autoLabel")}
          aria-busy={autoLabel.busy}
          disabled={autoLabel.busy || autoLabel.disabled}
          onClick={autoLabel.onStart}
        >
          {autoLabel.busy ? (
            <IconLoader2 aria-hidden className="animate-spin motion-reduce:animate-none" />
          ) : (
            <IconTagStarred aria-hidden />
          )}
        </Button>
      ) : null}
      {hasStale ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 md:size-8"
          aria-label={t("sources.syncAll")}
          title={t("sources.syncAll")}
          disabled={syncing}
          onClick={onSyncAll}
        >
          <IconRefresh aria-hidden />
        </Button>
      ) : null}
      <Button
        ref={search.buttonRef}
        type="button"
        variant="ghost"
        size="icon"
        className="size-11 md:size-8"
        aria-label={t("sources.search")}
        title={t("sources.search")}
        aria-expanded={search.open}
        onClick={search.onToggle}
      >
        <IconSearch aria-hidden />
      </Button>
      {groupBy ? (
        <GroupByMenu control={groupBy} />
      ) : canFlat ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 md:size-8"
          aria-label={flat ? t("sources.showGrouped") : t("sources.showFlat")}
          title={flat ? t("sources.showGrouped") : t("sources.showFlat")}
          aria-pressed={flat}
          onClick={onToggleFlat}
        >
          {flat ? <IconCategory aria-hidden /> : <IconList aria-hidden />}
        </Button>
      ) : null}
      <div className="ms-auto flex items-center text-sm">
        <span aria-hidden className="text-muted-foreground">
          {t("sources.selectAll")}
        </span>
        <SelectionCheckbox
          aria-label={t("sources.selectAll")}
          checked={selection === "all"}
          indeterminate={selection === "some"}
          disabled={!hasUsable}
          onCheckedChange={onToggleAll}
        />
      </div>
    </div>
  )
}

function GroupByMenu({ control }: { control: GroupByControl }) {
  const t = useT("notebooks")
  const Icon = control.value === "topic" ? IconTag : control.value === "none" ? IconList : IconCategory
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 md:size-8"
            aria-label={t("sources.groupBy")}
            title={t("sources.groupBy")}
          />
        }
      >
        <Icon aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuRadioGroup value={control.value} onValueChange={(value) => control.onChange(value as GroupBy)}>
          <DropdownMenuRadioItem value="type" className="min-h-11 md:min-h-8" closeOnClick>
            {t("sources.groupByType")}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="topic" className="min-h-11 md:min-h-8" closeOnClick>
            {t("sources.groupByTopic")}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="none" className="min-h-11 md:min-h-8" closeOnClick>
            {t("sources.groupByNone")}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
