"use client"

import type { SourceItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, cn } from "@ihsp/ui"
import { IconDots, IconExternalLink, IconPencil, IconRefresh, IconTrash } from "@ihsp/ui"
import { canSync } from "./source-rules"

type SourceActionsMenuProps = {
  source: SourceItem
  /** Shows "Open source" (the panel row; the viewer is already open). */
  onOpen?: () => void
  onRename: () => void
  onSync: () => void
  onRemove: () => void
  /** Row menus appear on hover and focus; the viewer's menu is always visible. */
  revealOnHover?: boolean
  className?: string
}

/** The ⋯ menu of a source: Open source, Rename, Sync, Remove. */
export function SourceActionsMenu({
  source,
  onOpen,
  onRename,
  onSync,
  onRemove,
  revealOnHover = false,
  className,
}: SourceActionsMenuProps) {
  const t = useT("notebooks")
  const itemClass = "min-h-11 md:min-h-8"
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("row.more", { title: source.title })}
            className={cn(
              "text-muted-foreground size-11 shrink-0 md:size-8",
              revealOnHover &&
                "[@media(hover:hover)]:md:opacity-0 [@media(hover:hover)]:md:group-focus-within/row:opacity-100 [@media(hover:hover)]:md:group-hover/row:opacity-100 [@media(hover:hover)]:md:data-popup-open:opacity-100",
              className,
            )}
          />
        }
      >
        <IconDots aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {onOpen ? (
          <DropdownMenuItem className={itemClass} onClick={onOpen}>
            <IconExternalLink aria-hidden />
            {t("row.open")}
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem className={itemClass} onClick={onRename}>
          <IconPencil aria-hidden />
          {t("row.rename")}
        </DropdownMenuItem>
        {canSync(source) ? (
          <DropdownMenuItem className={itemClass} onClick={onSync}>
            <IconRefresh aria-hidden />
            {t("row.sync")}
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem variant="destructive" className={itemClass} onClick={onRemove}>
          <IconTrash aria-hidden />
          {t("row.remove")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
