"use client"

import { useT } from "@ihsp/i18n"
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@ihsp/ui"
import { IconDots, IconPencil, IconTrash } from "@ihsp/ui"

type LabelMenuProps = {
  /** The name of the topic, for the button label. */
  name: string
  onRename: () => void
  onDelete: () => void
}

/** The ⋯ menu in the header of a topic group: rename it in place, or delete the label (its sources stay). */
export function LabelMenu({ name, onRename, onDelete }: LabelMenuProps) {
  const t = useT("notebooks")
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("row.more", { title: name })}
            className="text-muted-foreground size-11 shrink-0 md:size-8"
          />
        }
      >
        <IconDots aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem className="min-h-11 md:min-h-8" onClick={onRename}>
          <IconPencil aria-hidden />
          {t("label.rename")}
        </DropdownMenuItem>
        <DropdownMenuItem className="min-h-11 md:min-h-8" variant="destructive" onClick={onDelete}>
          <IconTrash aria-hidden />
          {t("label.delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
