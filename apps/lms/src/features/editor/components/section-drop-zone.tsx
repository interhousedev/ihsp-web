"use client"

import { useDroppable } from "@dnd-kit/core"
import { useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import { sectionDropId } from "../utils/outline-ops"

/** The end of a section's list: dropping a step here appends it (the only target of an empty section). */
export function SectionDropZone({ sectionId, empty }: { sectionId: string; empty: boolean }) {
  const t = useT("outline")
  const { setNodeRef, isOver } = useDroppable({ id: sectionDropId(sectionId) })
  return (
    <li
      ref={setNodeRef}
      aria-hidden={!empty}
      className={cn(
        "text-muted-foreground list-none rounded-md border border-dashed text-center text-xs",
        empty ? "py-3" : "py-1",
        isOver && "border-primary bg-primary/5",
      )}
    >
      {empty ? t("emptySection") : null}
    </li>
  )
}
