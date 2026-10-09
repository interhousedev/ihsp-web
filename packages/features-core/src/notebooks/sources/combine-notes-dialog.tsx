"use client"

import type { SourceItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  LoadingButton,
} from "@ihsp/ui"
import { useId, useState } from "react"
import { useLoadedNotebook } from "../api"
import { useCombineNotes } from "./use-combine-notes"

const MAX_TITLE_LENGTH = 200

type CombineNotesDialogProps = {
  notebookId: string
  /** The selected, ready notes to combine. */
  notes: readonly SourceItem[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Combine selected notes into one: the title of the new note ("Notes · <notebook>" unless changed), the notes in the
 * order of their sections and a checkbox that unselects the originals. Closes when the new note was written.
 */
export function CombineNotesDialog({ notebookId, notes, open, onOpenChange }: CombineNotesDialogProps) {
  const t = useT("notebooks")
  const notebook = useLoadedNotebook(notebookId)
  const { combine, pending, error, reset } = useCombineNotes(notebookId)
  const titleId = useId()
  const [edited, setEdited] = useState<string | null>(null)
  const [unselect, setUnselect] = useState(true)

  const notebookTitle = notebook.data?.title.trim()
  const title =
    edited ?? (notebookTitle ? t("combine.defaultTitle", { title: notebookTitle }) : t("combine.fallbackTitle"))
  const trimmed = title.trim()
  const ordered = notes.toSorted((a, b) => a.position - b.position)

  function change(next: boolean) {
    if (pending) return
    if (!next) {
      setEdited(null)
      setUnselect(true)
      reset()
    }
    onOpenChange(next)
  }

  async function submit() {
    if (await combine({ notes: ordered, title: trimmed, unselect })) change(false)
  }

  return (
    <Dialog open={open} onOpenChange={change}>
      <DialogContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (!pending && trimmed !== "") void submit()
          }}
        >
          <DialogHeader>
            <DialogTitle>{t("combine.title")}</DialogTitle>
            <DialogDescription>{t("combine.description")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1">
            <Label htmlFor={titleId}>{t("combine.titleLabel")}</Label>
            <Input
              id={titleId}
              value={title}
              maxLength={MAX_TITLE_LENGTH}
              className="min-h-11"
              onChange={(event) => setEdited(event.target.value)}
            />
          </div>
          <ol
            aria-label={t("combine.listLabel")}
            className="max-h-40 list-decimal overflow-y-auto rounded-lg border py-2 pe-3 ps-8 text-sm"
          >
            {ordered.map((note) => (
              <li key={note.id} className="py-0.5 break-words">
                {note.title}
              </li>
            ))}
          </ol>
          <label className="flex min-h-11 items-center gap-2 text-sm md:min-h-8">
            <Checkbox checked={unselect} onCheckedChange={(checked) => setUnselect(checked === true)} />
            <span>{t("combine.unselect")}</span>
          </label>
          {error ? (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={pending}
              onClick={() => change(false)}
            >
              {t("combine.cancel")}
            </Button>
            <LoadingButton
              type="submit"
              className="min-h-11"
              loading={pending}
              loadingLabel={t("combine.working")}
              disabled={trimmed === ""}
            >
              {t("combine.submit")}
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
