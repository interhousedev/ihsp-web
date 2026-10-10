"use client"

import { useT } from "@ihsp/i18n"
import { Button, IconEdit, IconPlus, IconTrash } from "@ihsp/ui"

export type NodeEditHandlers = {
  /** Root: no sibling, no delete. */
  isRoot: boolean
  onAddChild: () => void
  onAddSibling: () => void
  onEdit: () => void
  onDelete: () => void
}

/** Add a child or a sibling, rename and delete the selected node (in the details card and the phone sheet). */
export function MindMapEditActions({ isRoot, onAddChild, onAddSibling, onEdit, onDelete }: NodeEditHandlers) {
  const t = useT("notebooks")
  const touch = "min-h-11 md:min-h-8"
  return (
    <div data-slot="mind-map-edit-actions" className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" className={touch} onClick={onAddChild}>
        <IconPlus aria-hidden />
        {t("mindmap.addChild")}
      </Button>
      {isRoot ? null : (
        <Button type="button" variant="outline" className={touch} onClick={onAddSibling}>
          <IconPlus aria-hidden />
          {t("mindmap.addSibling")}
        </Button>
      )}
      <Button type="button" variant="outline" className={touch} onClick={onEdit}>
        <IconEdit aria-hidden />
        {t("mindmap.edit")}
      </Button>
      {isRoot ? null : (
        <Button type="button" variant="ghost" className={`${touch} text-destructive`} onClick={onDelete}>
          <IconTrash aria-hidden />
          {t("mindmap.delete")}
        </Button>
      )}
    </div>
  )
}
