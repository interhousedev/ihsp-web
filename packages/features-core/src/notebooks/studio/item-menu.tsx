"use client"

import type { ArtifactItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@ihsp/ui"
import { IconDotsVertical } from "@ihsp/ui"
import Link from "next/link"
import { isActive } from "../lib/artifact-kinds"
import { ArtifactExportItems } from "./artifact-export-items"

export type ItemMenuProps = {
  notebookId: string
  item: ArtifactItem
  /** Name of the item for the button label. */
  title: string
  onRename: () => void
  onViewPrompt: () => void
  onAddAsSource: () => void
  onSaveSet: () => void
  onCancel: () => void
  onDelete: () => void
}

const ITEM_CLASS = "min-h-11 md:min-h-8"

/** The ⋮ menu of a Studio item; the entries depend on the state and the kind (download, share and add to my files included). */
export function ItemMenu({
  notebookId,
  item,
  title,
  onRename,
  onViewPrompt,
  onAddAsSource,
  onSaveSet,
  onCancel,
  onDelete,
}: ItemMenuProps) {
  const t = useT("notebooks")
  const ready = item.status === "ready"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground size-11 shrink-0 md:size-8"
            aria-label={t("studio.menu", { title })}
          />
        }
      >
        <IconDotsVertical aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {ready ? (
          <DropdownMenuItem className={ITEM_CLASS} onClick={onRename}>
            {t("studio.rename")}
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem className={ITEM_CLASS} onClick={onViewPrompt}>
          {t("item.viewPrompt")}
        </DropdownMenuItem>
        {ready && item.kind === "report" ? (
          <DropdownMenuItem className={ITEM_CLASS} onClick={onAddAsSource}>
            {t("item.addAsSource")}
          </DropdownMenuItem>
        ) : null}
        {ready && item.kind === "flashcards" ? (
          item.flashcard_set_id ? (
            <DropdownMenuItem
              className={ITEM_CLASS}
              render={<Link href={`/flashcards/set/?id=${encodeURIComponent(item.flashcard_set_id)}`} />}
            >
              {t("cards.openSet")}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem className={ITEM_CLASS} onClick={onSaveSet}>
              {t("cards.saveSet")}
            </DropdownMenuItem>
          )
        ) : null}
        <ArtifactExportItems
          notebookId={notebookId}
          item={{ id: item.id, kind: item.kind, status: item.status, title }}
        />
        {isActive(item) ? (
          <DropdownMenuItem className={ITEM_CLASS} onClick={onCancel}>
            {t("studio.cancel")}
          </DropdownMenuItem>
        ) : (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" className={ITEM_CLASS} onClick={onDelete}>
              {t("studio.delete")}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
