"use client"

import { useT } from "@ihsp/i18n"
import { Button } from "@ihsp/ui"
import { IconCategory, IconList, IconRefresh, IconSearch } from "@tabler/icons-react"
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
  onSyncAll: () => void
  onToggleAll: (selected: boolean) => void
  onToggleFlat: () => void
}

/** Sync outdated, search, grouped / flat toggle and the tri-state "Select all sources" checkbox. */
export function SourcesToolbar({
  selection,
  hasStale,
  hasUsable,
  syncing,
  canFlat,
  flat,
  search,
  onSyncAll,
  onToggleAll,
  onToggleFlat,
}: SourcesToolbarProps) {
  const t = useT("notebooks")
  return (
    <div className="flex items-center gap-1 px-3 md:px-4">
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
      {canFlat ? (
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
