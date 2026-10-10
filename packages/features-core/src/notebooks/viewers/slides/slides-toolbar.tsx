"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons, IconButton } from "@ihsp/ui"
import { OverflowMenu } from "../overflow-menu"
import { IconCopy, IconNotes, IconPlayerPlay, IconPrinter } from "@ihsp/ui"

export type DeckMode = "view" | "edit" | "revise"

type SlidesToolbarProps = {
  mode: DeckMode
  notesOpen: boolean
  onMode: (mode: DeckMode) => void
  onToggleNotes: () => void
  onStart: () => void
  onCopyOutline: () => void
  onPrint: () => void
}

/** One row: Start slideshow, Edit, Revise, Speaker notes, and a "⋯" menu with Copy outline and Print / PDF. */
export function SlidesToolbar({
  mode,
  notesOpen,
  onMode,
  onToggleNotes,
  onStart,
  onCopyOutline,
  onPrint,
}: SlidesToolbarProps) {
  const t = useT("notebooks.slides")
  return (
    <div role="toolbar" aria-label={t("slideshow")} className="flex flex-nowrap items-center gap-2 overflow-x-auto [&>*]:shrink-0 px-3 py-1 md:px-0">
      <Button type="button" className="min-h-11 md:min-h-8" onClick={onStart}>
        <IconPlayerPlay aria-hidden />
        {t("start")}
      </Button>
      <Button
        type="button"
        variant={mode === "edit" ? "secondary" : "outline"}
        className="min-h-11 md:min-h-8"
        aria-pressed={mode === "edit"}
        onClick={() => onMode(mode === "edit" ? "view" : "edit")}
      >
        <Icons.edit aria-hidden />
        {t("edit")}
      </Button>
      <Button
        type="button"
        variant={mode === "revise" ? "secondary" : "outline"}
        className="min-h-11 md:min-h-8"
        aria-pressed={mode === "revise"}
        onClick={() => onMode(mode === "revise" ? "view" : "revise")}
      >
        <Icons.sparkles aria-hidden />
        {t("revise")}
      </Button>
      <IconButton
        icon={IconNotes}
        variant={notesOpen ? "secondary" : "outline"}
        className="size-11 md:size-8"
        aria-pressed={notesOpen}
        aria-keyshortcuts="N"
        aria-label={t("notes")}
        onClick={onToggleNotes}
      />
      <OverflowMenu
        label={t("more")}
        items={[
          { key: "copy", label: t("copyOutline"), icon: IconCopy, onSelect: onCopyOutline },
          { key: "print", label: t("print"), icon: IconPrinter, onSelect: onPrint },
        ]}
      />
    </div>
  )
}
