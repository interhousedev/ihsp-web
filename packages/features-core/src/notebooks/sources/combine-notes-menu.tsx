"use client"

import { useT } from "@ihsp/i18n"
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@ihsp/ui"
import { IconArrowMerge, IconDots } from "@ihsp/ui"
import { useId, useState } from "react"
import { useLoadedNotebook, useSources } from "../api"
import { useWorkspace } from "../workspace-context"
import { CombineNotesDialog } from "./combine-notes-dialog"

type CombineNotesMenuProps = {
  /** The translated name of the group, for the button label. */
  name: string
}

/**
 * The ⋯ menu in the header of the Notes group: "Combine selected notes", enabled with two or more selected, ready
 * notes of the notebook (also those a title search hides). Hidden in read-only course workspaces (and until the
 * notebook is known) since it writes a new note.
 */
export function CombineNotesMenu({ name }: CombineNotesMenuProps) {
  const t = useT("notebooks")
  const { notebookId } = useWorkspace()
  const notebook = useLoadedNotebook(notebookId)
  const sources = useSources(notebookId)
  const hintId = useId()
  const [open, setOpen] = useState(false)
  if (notebook.data === undefined || notebook.data.can_write === false) return null

  const selected = (sources.data ?? []).filter(
    (source) => source.kind === "note" && source.selected && source.status === "ready",
  )
  const canCombine = selected.length >= 2
  return (
    <>
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
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuItem
            className="min-h-11 md:min-h-8"
            disabled={!canCombine}
            aria-describedby={canCombine ? undefined : hintId}
            onClick={() => setOpen(true)}
          >
            <IconArrowMerge aria-hidden />
            {t("combine.action")}
          </DropdownMenuItem>
          {canCombine ? null : (
            <p id={hintId} className="text-muted-foreground px-2 py-1.5 text-xs">
              {t("combine.hint")}
            </p>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <CombineNotesDialog notebookId={notebookId} notes={selected} open={open} onOpenChange={setOpen} />
    </>
  )
}
