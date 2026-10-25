"use client"

import type { NotebookDetail, SubjectNotebookSlot } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import { useOpenSubjectNotebook } from "../api/use-subject-slots"
import { useNotebookErrorMessage } from "../lib/use-notebook-error"

const SUBJECT_EMOJI = "📚"

/** "Algebra", or "Algebra · 2TN2" for a teacher's subject and group. */
export function subjectSlotTitle(slot: Pick<SubjectNotebookSlot, "subject_name" | "group_name">): string {
  return slot.group_name ? `${slot.subject_name} · ${slot.group_name}` : slot.subject_name
}

/** The slots whose notebook is not made yet (those with one are listed as normal notebook cards), filtered by title. */
export function placeholderSlots(slots: readonly SubjectNotebookSlot[] | undefined, query = ""): SubjectNotebookSlot[] {
  const needle = query.trim().toLowerCase()
  return (slots ?? []).filter(
    (slot) => slot.notebook_id === null && (needle === "" || subjectSlotTitle(slot).toLowerCase().includes(needle)),
  )
}

function SlotCard({
  slot,
  compact,
  onOpened,
}: {
  slot: SubjectNotebookSlot
  compact: boolean
  onOpened: (notebook: NotebookDetail) => void
}) {
  const t = useT("notebooks")
  const open = useOpenSubjectNotebook()
  const errorMessage = useNotebookErrorMessage()
  return (
    <li className="flex flex-col gap-1" data-slot-subject={slot.subject_id}>
      <button
        type="button"
        disabled={open.isPending}
        onClick={() => open.mutate(slot, { onSuccess: onOpened })}
        className={cn(
          "bg-card hover:bg-muted/50 focus-visible:ring-ring ring-foreground/10 flex h-full w-full flex-col rounded-xl border-dashed text-start ring-1 transition-colors outline-none focus-visible:ring-2 disabled:opacity-60",
          compact ? "min-h-20 gap-1.5 p-3" : "min-h-32 gap-3 p-4",
        )}
      >
        <span aria-hidden className={cn("leading-none", compact ? "text-2xl" : "text-4xl")}>
          {SUBJECT_EMOJI}
        </span>
        <span className="line-clamp-2 min-w-0 text-sm leading-snug font-medium break-words">
          {subjectSlotTitle(slot)}
        </span>
        <span className="text-muted-foreground mt-auto text-xs">
          {open.isPending ? t("list.slot.opening") : t("list.slot.hint")}
        </span>
      </button>
      {open.isError ? (
        <p role="alert" className="text-destructive text-xs">
          {errorMessage(open.error)}
        </p>
      ) : null}
    </li>
  )
}

/**
 * Placeholder cards for the subjects (teachers: subject and group) that have no notebook yet. A click creates the
 * notebook (the server makes one, however many clicks) and calls `onOpened` so the app can navigate to it.
 */
export function SubjectSlotCards({
  slots,
  compact = false,
  onOpened,
}: {
  slots: readonly SubjectNotebookSlot[]
  compact?: boolean
  onOpened: (notebook: NotebookDetail) => void
}) {
  return (
    <>
      {slots.map((slot) => (
        <SlotCard key={`${slot.subject_id}:${slot.group_id ?? ""}`} slot={slot} compact={compact} onOpened={onOpened} />
      ))}
    </>
  )
}
