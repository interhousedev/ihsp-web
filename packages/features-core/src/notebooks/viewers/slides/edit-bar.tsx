"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"

type EditBarProps = {
  /** 0-based position of the selected slide. */
  index: number
  total: number
  onMove: (delta: -1 | 1) => void
  onDelete: () => void
}

/** Move up, Move down and Delete for the selected slide (the buttons work where the thumbnails are hidden). */
export function EditBar({ index, total, onMove, onDelete }: EditBarProps) {
  const t = useT("notebooks.slides")
  return (
    <div role="toolbar" aria-label={t("edit")} className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        className="min-h-11 md:min-h-8"
        disabled={index <= 0}
        onClick={() => onMove(-1)}
      >
        <Icons.chevronUp aria-hidden />
        {t("moveUp")}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="min-h-11 md:min-h-8"
        disabled={index >= total - 1}
        onClick={() => onMove(1)}
      >
        <Icons.chevronDown aria-hidden />
        {t("moveDown")}
      </Button>
      <Button
        type="button"
        variant="destructive"
        className="min-h-11 md:min-h-8"
        disabled={total <= 1}
        onClick={onDelete}
      >
        <Icons.trash aria-hidden />
        {t("delete")}
      </Button>
    </div>
  )
}
