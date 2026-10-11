"use client"

import type { Journal } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { MarkBadge, cn } from "@ihsp/ui"

const lateCell = "rounded-md bg-orange-600/20 ring-1 ring-orange-600/50"
const failedCell = "rounded-md ring-2 ring-destructive"

type Cell = Journal["students"][number]["cells"][number]

/**
 * One cell of the journal (UF-STF-07): "absent" and the EMIS marks (read-only). Inside the 7-day window the cell is a
 * button that cycles the student's mark (present, absent, late); older lessons are plain text. The cell is one stop of
 * the grid's roving focus (`tabIndex`, `onFocus`); the grid handles the arrow keys. A change the server refused keeps
 * a red ring (`failed`) until the cell is changed successfully.
 */
export function JournalCell({
  cell,
  studentName,
  date,
  editable,
  notTaken,
  failed = false,
  tabIndex = -1,
  position,
  onFocus,
  onToggle,
}: {
  cell: Cell
  studentName: string
  date: string
  editable: boolean
  notTaken: boolean
  failed?: boolean
  tabIndex?: 0 | -1
  /** Row and column of the cell in the grid (zero-based), for the keyboard navigation. */
  position?: { row: number; col: number }
  onFocus?: () => void
  onToggle: () => void
}) {
  const t = useT("journal")
  const content = (
    <span className="flex min-h-6 flex-wrap items-center justify-center gap-0.5">
      {cell.absent ? (
        <span
          className={cn(
            "rounded-md px-1.5 py-0.5 text-xs font-semibold",
            cell.excused ? "bg-muted text-foreground border" : "bg-destructive/10 text-destructive",
          )}
        >
          {cell.excused ? t("excusedMark") : t("absentMark")}
        </span>
      ) : null}
      {cell.late ? (
        <span className="rounded-md bg-orange-600/15 px-1.5 py-0.5 text-xs font-semibold text-orange-800 dark:bg-orange-500/20 dark:text-orange-300">
          {t("lateMark")}
        </span>
      ) : null}
      {cell.marks.map((mark, index) => (
        <MarkBadge key={index} mark={mark} size="sm" />
      ))}
      {!cell.absent && !cell.late && cell.marks.length === 0 ? (
        <span className="text-muted-foreground text-xs" aria-hidden>
          {notTaken ? "–" : "·"}
        </span>
      ) : null}
    </span>
  )
  const state = cell.absent ? (cell.excused ? t("excused") : t("absent")) : cell.late ? t("late") : t("present")
  const label = t("cellLabel", { name: studentName, date, state })
  const positionAttrs = position ? { "data-row": position.row, "data-col": position.col } : {}

  if (!editable) {
    return (
      <div
        aria-label={label}
        role="img"
        tabIndex={tabIndex}
        {...positionAttrs}
        className={cn(
          "focus-visible:ring-ring flex min-h-11 min-w-11 items-center justify-center rounded-md outline-none focus-visible:ring-2",
          cell.late && lateCell,
        )}
      >
        {content}
      </div>
    )
  }
  return (
    <button
      type="button"
      aria-pressed={cell.absent || cell.late}
      aria-label={failed ? `${label} · ${t("notSaved")}` : label}
      title={failed ? t("notSaved") : undefined}
      data-failed={failed || undefined}
      tabIndex={tabIndex}
      onFocus={onFocus}
      onClick={onToggle}
      {...positionAttrs}
      className={cn(
        "hover:bg-accent focus-visible:ring-ring flex min-h-11 min-w-11 items-center justify-center rounded-md outline-none focus-visible:ring-2",
        cell.late && lateCell,
        failed && failedCell,
      )}
    >
      {content}
    </button>
  )
}
