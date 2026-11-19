"use client"

import { ResponsiveDialog } from "@ihsp/ui"
import { useT } from "@ihsp/i18n"
import type { Item } from "../api"
import { ItemEditor } from "./item-editor"

/** The editor of one item in a popup; closing (or deleting the item) calls `onClose`. */
export function EditItemDialog({ item, onClose }: { item: Item; onClose: () => void }) {
  const t = useT("items")
  return (
    <ResponsiveDialog open onOpenChange={(open) => !open && onClose()} title={item.title || t("edit.title")} size="lg">
      <ItemEditor key={item.id} item={item} onDeleted={onClose} />
    </ResponsiveDialog>
  )
}
