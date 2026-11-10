"use client"

import type { Journal } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { AttendanceStatus } from "@ihsp/features-core"
import { IconFileText, MarkBadge, cn } from "@ihsp/ui"
import { canExcuse, isExcusedLocked, stateOfCell } from "./attendance-rules"

const lateCell = "rounded-md bg-warning-muted ring-1 ring-warning/50"
const failedCell = "rounded-md ring-2 ring-destructive"

const EXCUSE_ORIGIN_KEY = {
  request: "excuseOriginRequest",
  curator: "excuseOriginCurator",
  teacher: "excuseOriginTeacher",
} as const

type Cell = Journal["students"][number]["cells"][number]

/**
 * One cell of the journal (UF-STF-07): "absent" and the EMIS marks (read-only). Inside the 7-day window the cell is a
 * button that cycles the student's mark (present, absent, late); older lessons are plain text. The cell is one stop of
 * the grid's roving focus (`tabIndex`, `onFocus`); the grid handles the arrow keys. A change the server refused keeps
 * a red ring (`failed`) until the cell is changed successfully.
 */
export function AttendanceCell({
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
  onExcuse,
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
  /** Opens the excuse dialog of the lesson; the control shows for an absence inside the edit window. */
  onExcuse?: () => void
}) {
  const t = useT("journal")
  const status = stateOfCell(cell)
  const content = (
    <span className="flex min-h-6 flex-wrap items-center justify-center gap-0.5">
      <AttendanceStatus state={status} notTaken={notTaken} />
      {cell.absent && cell.excuse ? (
        <span
          title={t(EXCUSE_ORIGIN_KEY[cell.excuse.origin])}
          data-testid="excuse-badge"
          data-origin={cell.excuse.origin}
          className="bg-muted text-muted-foreground rounded-md px-1 py-0.5 text-[10px] font-medium"
        >
          {t("excuseBadge")}
        </span>
      ) : null}
      {cell.marks.map((mark, index) => (
        <MarkBadge key={index} mark={mark} size="sm" />
      ))}
      {cell.temporary_mark ? (
        <span
          title={cell.temporary_mark.comment ?? t("temporaryMark")}
          className="rounded-md border border-dashed border-primary/70 px-1.5 py-0.5 text-xs font-semibold text-primary italic"
          data-temporary="true"
        >
          {cell.temporary_mark.value}
        </span>
      ) : null}
    </span>
  )
  // A present student in a lesson without attendance is "not taken", not present.
  const base = status === "present" && notTaken ? t("notTaken") : t(status)
  const state = cell.temporary_mark ? `${base}, ${t("temporaryState", { value: cell.temporary_mark.value })}` : base
  const label = t("cellLabel", { name: studentName, date, state })
  const positionAttrs = position ? { "data-row": position.row, "data-col": position.col } : {}
  const locked = isExcusedLocked(cell, editable)

  const readOnly = (
    <div
      aria-label={label}
      role="img"
      tabIndex={tabIndex}
      data-excused-locked={locked || undefined}
      title={locked ? t("excusedLocked") : undefined}
      {...positionAttrs}
      className={cn(
        "focus-visible:ring-ring flex min-h-11 min-w-11 items-center justify-center rounded-md outline-none focus-visible:ring-2",
        cell.late && lateCell,
      )}
    >
      {content}
    </div>
  )
  if (!editable) return readOnly
  const button = locked ? (
    readOnly
  ) : (
    <button
      type="button"
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
  const excusable = onExcuse !== undefined && canExcuse(cell, editable)
  return (
    <span className="flex items-center">
      {button}
      {excusable ? (
        <button
          type="button"
          aria-label={t("excuseFor", { name: studentName, date })}
          title={t("excuse")}
          data-testid="excuse-button"
          onClick={onExcuse}
          className="hover:bg-accent text-muted-foreground focus-visible:ring-ring flex min-h-11 min-w-11 items-center justify-center rounded-md outline-none focus-visible:ring-2"
        >
          <IconFileText className="size-3.5" aria-hidden />
        </button>
      ) : null}
    </span>
  )
}
