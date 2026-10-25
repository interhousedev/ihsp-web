"use client"

import { useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"

type NotesPanelProps = {
  notes: string
  className?: string
}

/** The speaker notes of the selected slide. */
export function NotesPanel({ notes, className }: NotesPanelProps) {
  const t = useT("notebooks.slides")
  const text = notes.trim()
  return (
    <section aria-label={t("notes")} className={cn("bg-muted/50 rounded-xl border p-3 md:p-4", className)}>
      <h3 className="text-muted-foreground mb-1 text-xs font-semibold">{t("notes")}</h3>
      {text ? (
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
      ) : (
        <p className="text-muted-foreground text-sm">{t("notesEmpty")}</p>
      )}
    </section>
  )
}
