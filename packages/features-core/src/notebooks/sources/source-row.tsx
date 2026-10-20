"use client"

import type { SourceItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Badge, Button, cn } from "@ihsp/ui"
import { IconRefresh } from "@ihsp/ui"
import { SourceKindIcon } from "../lib/source-icons"
import { isUsable } from "../lib/sort-sources"
import { SelectionCheckbox } from "./selection-checkbox"
import { canReread } from "./source-rules"
import { SourceActionsMenu } from "./source-actions-menu"
import { SourceStatusLine } from "./source-status-line"

type SourceRowProps = {
  source: SourceItem
  onOpen: (source: SourceItem) => void
  onToggle: (source: SourceItem, selected: boolean) => void
  onRename: (source: SourceItem) => void
  onSync: (source: SourceItem) => void
  /** Extracts the text again for a source without text; `rereading` while the request is out. */
  onReread?: (source: SourceItem) => void
  rereading?: boolean
  onRemove: (source: SourceItem) => void
  /** Given in subject and lesson notebooks: synced sources get a "From lessons" badge and **Exclude**. */
  onExclude?: (source: SourceItem) => void
  /** A reader of a course workspace: no sync, rename or removal, and the selection stays as it is. */
  readOnly?: boolean
}

/**
 * One source: the whole row is a button that opens the viewer; the checkbox at the right selects the source for
 * answers and Studio; a status line explains a source that is not ready (an outdated one has a **Sync** button).
 */
export function SourceRow({
  source,
  onOpen,
  onToggle,
  onRename,
  onSync,
  onReread,
  rereading = false,
  onRemove,
  onExclude,
  readOnly = false,
}: SourceRowProps) {
  const t = useT("notebooks")
  const usable = isUsable(source)
  return (
    <li
      className={cn(
        "group/row hover:bg-muted/60 focus-within:bg-muted/60 flex items-center rounded-lg",
        !usable && source.status !== "pending" && source.status !== "processing" && "bg-amber-500/5",
      )}
    >
      <button
        type="button"
        onClick={() => onOpen(source)}
        className="focus-visible:ring-ring flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-lg py-1 ps-2 pe-1 text-start outline-hidden focus-visible:ring-2"
      >
        <SourceKindIcon kind={source.kind} title={source.title} className="size-5" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-sm font-medium" title={source.title}>
              {source.title}
            </span>
            {onExclude && source.synced ? (
              <Badge variant="secondary" className="shrink-0 px-1.5 text-[0.65rem]">
                {t("row.fromLessons")}
              </Badge>
            ) : null}
          </span>
          <SourceStatusLine source={source} />
        </span>
      </button>
      {onReread && canReread(source) && !readOnly ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-11 shrink-0 gap-1 px-2 md:min-h-7"
          disabled={rereading}
          onClick={() => onReread(source)}
        >
          <IconRefresh aria-hidden className={rereading ? "animate-spin" : undefined} />
          {rereading ? t("row.rereading") : t("row.reread")}
        </Button>
      ) : null}
      {source.status === "stale" && !readOnly ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-11 shrink-0 gap-1 px-2 md:min-h-7"
          onClick={() => onSync(source)}
        >
          <IconRefresh aria-hidden />
          {t("row.sync")}
        </Button>
      ) : null}
      {readOnly ? null : (
        <SourceActionsMenu
          source={source}
          revealOnHover
          onOpen={() => onOpen(source)}
          onRename={() => onRename(source)}
          onSync={() => onSync(source)}
          onRemove={() => onRemove(source)}
          onExclude={onExclude ? () => onExclude(source) : undefined}
        />
      )}
      <SelectionCheckbox
        aria-label={source.title}
        checked={usable && source.selected}
        disabled={!usable || readOnly}
        onCheckedChange={(selected) => onToggle(source, selected)}
      />
    </li>
  )
}
