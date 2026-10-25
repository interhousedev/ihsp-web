"use client"

import type { AnnotationColor } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Textarea,
} from "@ihsp/ui"
import { useEffect, useState } from "react"
import { ColorPicker } from "./color-picker"

const MAX_NOTE = 2000

export type NoteDialogProps = {
  open: boolean
  onOpenChange(open: boolean): void
  mode: "create" | "edit"
  /** The quoted text the note belongs to (nothing for a bookmark). */
  quote: string | null
  note: string
  color: AnnotationColor
  onSave(value: { note: string; color: AnnotationColor }): void
}

/** Write or edit the note of a highlight, and choose its colour. A note may be empty when editing (it then clears). */
export function NoteDialog({ open, onOpenChange, mode, quote, note, color, onSave }: NoteDialogProps) {
  const t = useT("library.annotation")
  const [text, setText] = useState(note)
  const [chosen, setChosen] = useState(color)

  useEffect(() => {
    if (open) {
      setText(note)
      setChosen(color)
    }
  }, [open, note, color])

  const empty = text.trim() === ""
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? t("noteDialogTitle") : t("editDialogTitle")}</DialogTitle>
          <DialogDescription>{t("noteDialogHint")}</DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (mode === "create" && empty) return
            onSave({ note: text.trim(), color: chosen })
            onOpenChange(false)
          }}
        >
          {quote ? (
            <blockquote className="text-muted-foreground border-s-2 ps-3 text-sm italic">
              <span className="line-clamp-4">{quote}</span>
            </blockquote>
          ) : null}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reader-note">{t("noteLabel")}</Label>
            <Textarea
              id="reader-note"
              value={text}
              maxLength={MAX_NOTE}
              autoFocus
              placeholder={t("notePlaceholder")}
              onChange={(event) => setText(event.target.value)}
              className="min-h-24"
            />
          </div>
          <ColorPicker value={chosen} onChange={setChosen} />
          <DialogFooter>
            <Button type="button" variant="outline" className="min-h-11 md:min-h-8" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" className="min-h-11 md:min-h-8" disabled={mode === "create" && empty}>
              {t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
