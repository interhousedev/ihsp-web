"use client"

import type { NotebookDetail, SourceItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, StateView } from "@ihsp/ui"
import { IconLayoutSidebarLeftCollapse, IconPlus } from "@ihsp/ui"
import { useState } from "react"
import { toast } from "sonner"
import { useAutoLabel, useLabels, useSelectSource, useSelectSources, useSources } from "../api"
import { canShowFlat, isUsable, selectionState } from "../lib/sort-sources"
import { groupByTopic } from "../lib/topic-groups"
import { useWorkspace } from "../workspace-context"
import { DiscoverBox } from "./discover-box"
import { DiscoverResults } from "./discover-results"
import { SourceActionDialogs } from "./source-action-dialogs"
import { SourceList } from "./source-list"
import { SourceRow } from "./source-row"
import { SourceSearchBar } from "./source-search-bar"
import { SourceSearchResults } from "./source-search-results"
import { SourcesEmpty } from "./sources-empty"
import { SourcesLimit } from "./sources-limit"
import { SourcesSkeleton } from "./sources-skeleton"
import { SourcesToolbar, type GroupBy } from "./sources-toolbar"
import { useDiscover } from "./use-discover"
import { useSourceActions } from "./use-source-actions"
import { useSourceSearch } from "./use-source-search"
import { useTextSearch } from "./use-text-search"

export type SourcesPanelProps = {
  notebook: NotebookDetail
  /** Shows a collapse button in the header (desktop panes); absent in tabs and sheets. */
  onCollapse?: () => void
}

/**
 * The Sources panel: add button, the Discover box, select all, search, sync
 * outdated, the list grouped by kind (or flat), source rows with their status, the empty drop zone and the "12 of 50
 * sources" footer. Discover results replace the list until they are added or closed; the title search filters it and
 * adds an "In the text" group. The Add sources dialog is rendered by the workspace (`openAddSources`).
 */
export function SourcesPanel({ notebook, onCollapse }: SourcesPanelProps) {
  const t = useT("notebooks")
  const notebookId = notebook.id
  const { openSource, openAddSources } = useWorkspace()
  const sources = useSources(notebookId)
  const selectOne = useSelectSource(notebookId)
  const selectMany = useSelectSources(notebookId)
  const actions = useSourceActions(notebookId)
  const discover = useDiscover(notebookId)
  const labels = useLabels(notebookId)
  // `null` follows the default: flat while the list is short and of one kind, grouped otherwise.
  const [flatChoice, setFlatChoice] = useState<boolean | null>(null)
  // With topic labels the Group by menu decides; `null` follows the default, the topics.
  const [groupChoice, setGroupChoice] = useState<GroupBy | null>(null)
  const autoLabel = useAutoLabel(notebookId, (ok) => {
    if (ok) setGroupChoice(null)
  })

  const readOnly = notebook.can_write === false
  const items = sources.data ?? []
  const search = useSourceSearch(items)
  const textSearch = useTextSearch(notebookId, search.open ? search.text : "")
  const shown = search.shown
  const flatAllowed = canShowFlat(items)
  const topicLabels = labels.data?.items ?? []
  const groupBy: GroupBy | null = topicLabels.length > 0 ? (groupChoice ?? "topic") : null
  const flat = groupBy ? groupBy === "none" : flatAllowed && (flatChoice ?? true)
  const topics =
    groupBy === "topic" ? { notebookId, groups: groupByTopic(shown, topicLabels, !search.active), readOnly } : undefined
  const stale = items.filter((source) => source.status === "stale")
  const selectionFailed = () => toast.error(t("sources.selectFailed"))

  function toggleSource(source: SourceItem, selected: boolean) {
    selectOne.mutate({ id: source.id, selected }, { onError: selectionFailed })
  }

  function toggleGroup(group: readonly SourceItem[], selected: boolean) {
    const ids = group.filter(isUsable).map((source) => source.id)
    if (ids.length > 0) selectMany.mutate({ selected, ids }, { onError: selectionFailed })
  }

  /** "Select all" acts on the sources that are shown: all of them, or the ones the title search leaves. */
  function toggleAll(selected: boolean) {
    const ids = shown.filter(isUsable).map((source) => source.id)
    if (!search.active) selectMany.mutate({ selected }, { onError: selectionFailed })
    else if (ids.length > 0) selectMany.mutate({ selected, ids }, { onError: selectionFailed })
  }

  const row = (source: SourceItem) => (
    <SourceRow
      key={source.id}
      source={source}
      onOpen={(item) => openSource(item.id)}
      onToggle={toggleSource}
      onRename={actions.startRename}
      onSync={actions.sync}
      onRemove={actions.startRemove}
      onExclude={notebook.auto ? actions.exclude : undefined}
      readOnly={readOnly}
    />
  )

  return (
    <section aria-label={t("sources.title")} className="flex h-full min-h-0 flex-col gap-2">
      <header className="flex items-center justify-between gap-2 px-3 pt-3 md:px-4">
        <h2 className="text-base font-semibold">{t("sources.title")}</h2>
        {onCollapse ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 md:size-8"
            aria-label={t("sources.collapse")}
            onClick={onCollapse}
          >
            <IconLayoutSidebarLeftCollapse aria-hidden />
          </Button>
        ) : null}
      </header>
      {readOnly ? (
        <p role="note" className="text-muted-foreground px-3 text-xs md:px-4">
          {t("course.readOnlySources")}
        </p>
      ) : (
        <>
          <div className="px-3 md:px-4">
            <Button type="button" variant="outline" className="min-h-11 w-full" onClick={openAddSources}>
              <IconPlus aria-hidden />
              {t("sources.add")}
            </Button>
          </div>
          <DiscoverBox flow={discover} compact={items.length > 0} />
        </>
      )}
      {items.length > 0 && !discover.open ? (
        <>
          <SourcesToolbar
            selection={selectionState(shown)}
            hasStale={stale.length > 0 && !readOnly}
            hasUsable={shown.some(isUsable) && !readOnly}
            syncing={actions.syncing}
            canFlat={flatAllowed}
            flat={flat}
            search={{ open: search.open, onToggle: search.toggle, buttonRef: search.buttonRef }}
            autoLabel={
              readOnly
                ? undefined
                : {
                    busy: autoLabel.busy,
                    disabled: !items.some((source) => source.selected && source.status === "ready"),
                    onStart: autoLabel.start,
                  }
            }
            groupBy={groupBy ? { value: groupBy, onChange: setGroupChoice } : undefined}
            onSyncAll={() => void actions.syncMany(stale)}
            onToggleAll={toggleAll}
            onToggleFlat={() => setFlatChoice(!flat)}
          />
          {search.open ? <SourceSearchBar text={search.text} onChange={search.setText} onClose={search.close} /> : null}
        </>
      ) : null}
      {autoLabel.failed && !readOnly ? (
        <p role="alert" className="text-destructive px-4 text-xs">
          {t("sources.autoLabelFailed")}
        </p>
      ) : null}
      {actions.syncError ? (
        <p role="alert" className="text-destructive px-4 text-xs">
          {actions.syncError}
        </p>
      ) : null}
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2 md:px-3">
        {discover.open ? (
          <DiscoverResults notebookId={notebookId} flow={discover} />
        ) : (
          <>
            {sources.isPending ? <SourcesSkeleton /> : null}
            {sources.isError ? (
              <StateView state="error" error={sources.error} onRetry={() => void sources.refetch()} />
            ) : null}
            {sources.isSuccess && items.length === 0 ? <SourcesEmpty notebookId={notebookId} /> : null}
            <SourceList sources={shown} flat={flat} topics={topics} renderRow={row} onToggleGroup={toggleGroup} />
            {search.open ? (
              <SourceSearchResults active={search.active} query={search.query} titleMatches={shown} text={textSearch} />
            ) : null}
          </>
        )}
      </div>
      {items.length > 0 ? <SourcesLimit count={items.length} /> : null}
      <SourceActionDialogs actions={actions} />
    </section>
  )
}
