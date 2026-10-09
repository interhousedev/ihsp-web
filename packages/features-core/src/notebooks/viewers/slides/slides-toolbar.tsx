"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import { IconCopy, IconNotes, IconPlayerPlay, IconPrinter } from "@tabler/icons-react"

/** Icon-only 44 px buttons on phones (the text stays for screen readers), icon and text from `sm`. */
const ICON_ON_PHONE = "min-h-11 min-w-11 sm:min-h-8 sm:min-w-0 md:min-h-8"

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

/** Start slideshow, Edit, Revise, Speaker notes, Copy outline, Print / PDF. */
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
    <div role="toolbar" aria-label={t("slideshow")} className="flex flex-wrap items-center gap-2">
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
      <Button
        type="button"
        variant={notesOpen ? "secondary" : "outline"}
        className={ICON_ON_PHONE}
        aria-pressed={notesOpen}
        aria-keyshortcuts="N"
        title={t("notes")}
        onClick={onToggleNotes}
      >
        <IconNotes aria-hidden />
        <span className="sr-only sm:not-sr-only">{t("notes")}</span>
      </Button>
      <Button
        type="button"
        variant="outline"
        className={ICON_ON_PHONE}
        title={t("copyOutline")}
        onClick={onCopyOutline}
      >
        <IconCopy aria-hidden />
        <span className="sr-only sm:not-sr-only">{t("copyOutline")}</span>
      </Button>
      <Button type="button" variant="outline" className={ICON_ON_PHONE} title={t("print")} onClick={onPrint}>
        <IconPrinter aria-hidden />
        <span className="sr-only sm:not-sr-only">{t("print")}</span>
      </Button>
    </div>
  )
}
