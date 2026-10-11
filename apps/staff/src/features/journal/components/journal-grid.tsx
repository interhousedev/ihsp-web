"use client"

import { isApiError, type Journal, type JournalParams } from "@ihsp/api"
import { todayIso, useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import { Badge, MarkBadge, cn } from "@ihsp/ui"
import Link from "next/link"
import { useId, useState, type KeyboardEvent } from "react"
import { toast } from "sonner"
import { lessonHref } from "../../shared/utils/lesson-time"
import { fullName } from "../../shared/utils/people"
import { useToggleAbsence } from "../hooks/use-toggle-absence"
import { JournalCell } from "./journal-cell"

type Position = { row: number; col: number }

/** The cell the arrow keys land on; Home/End go to the first/last lesson of the row, Ctrl+Home/End to the corners. */
function moveTo(key: string, ctrl: boolean, from: Position, rows: number, cols: number): Position | null {
  switch (key) {
    case "ArrowRight":
      return { row: from.row, col: Math.min(from.col + 1, cols - 1) }
    case "ArrowLeft":
      return { row: from.row, col: Math.max(from.col - 1, 0) }
    case "ArrowDown":
      return { row: Math.min(from.row + 1, rows - 1), col: from.col }
    case "ArrowUp":
      return { row: Math.max(from.row - 1, 0), col: from.col }
    case "Home":
      return { row: ctrl ? 0 : from.row, col: 0 }
    case "End":
      return { row: ctrl ? rows - 1 : from.row, col: cols - 1 }
    default:
      return null
  }
}

/**
 * The journal grid (STF-9, UF-STF-07): students are rows, lessons of the term are columns. The first column and the
 * header stay in place while the grid scrolls sideways, so it works at 360 px. A column header opens the lesson;
 * a column without attendance is shaded "not taken".
 *
 * Keyboard: the cells are one tab stop (roving focus); the arrow keys, Home and End move between them, Space or Enter
 * toggles. A change the server refused keeps its cell marked ("not saved") until that cell is changed successfully;
 * the grid itself is reloaded after the error, and a conflict (someone else changed the lesson) says so.
 */
export function JournalGrid({ journal, params }: { journal: Journal; params: JournalParams }) {
  const t = useT("journal")
  const f = useFormatters()
  const errorMessage = useErrorMessage()
  const toggle = useToggleAbsence(params)
  const today = todayIso()
  const hintId = useId()
  const [active, setActive] = useState<Position>({ row: 0, col: 0 })
  const [failed, setFailed] = useState<ReadonlySet<string>>(new Set())

  if (journal.students.length === 0 || journal.lessons.length === 0) return null
  const rows = journal.students.length
  const cols = journal.lessons.length

  function onKeyDown(event: KeyboardEvent<HTMLTableSectionElement>) {
    const target = event.target as HTMLElement
    const row = Number(target.dataset.row)
    const col = Number(target.dataset.col)
    if (!Number.isInteger(row) || !Number.isInteger(col)) return
    const next = moveTo(event.key, event.ctrlKey || event.metaKey, { row, col }, rows, cols)
    if (!next) return
    event.preventDefault()
    setActive(next)
    event.currentTarget.querySelector<HTMLElement>(`[data-row="${next.row}"][data-col="${next.col}"]`)?.focus()
  }

  function onError(error: unknown, key: string) {
    setFailed((current) => new Set(current).add(key))
    const conflict = isApiError(error) && (error.status === 409 || error.type === "common/conflict")
    toast.error(conflict ? t("conflictReloaded") : errorMessage(error))
  }

  function onSuccess(key: string) {
    setFailed((current) => {
      if (!current.has(key)) return current
      const next = new Set(current)
      next.delete(key)
      return next
    })
  }

  return (
    <div className="relative max-h-[70dvh] w-full overflow-auto rounded-lg border" data-testid="journal-grid">
      <p id={hintId} className="sr-only">
        {t("keysHint")}
      </p>
      {/* oxlint-disable jsx-a11y/no-noninteractive-element-to-interactive-role -- WAI-ARIA grid: a table whose cells are one roving tab stop */}
      <table
        role="grid"
        aria-label={t("title")}
        aria-describedby={hintId}
        aria-rowcount={rows + 1}
        aria-colcount={cols + 3}
        className="w-full border-separate border-spacing-0 text-sm"
      >
        {/* oxlint-enable jsx-a11y/no-noninteractive-element-to-interactive-role */}
        <thead>
          <tr aria-rowindex={1}>
            <th
              scope="col"
              aria-colindex={1}
              className="bg-muted sticky top-0 left-0 z-30 min-w-36 border-b border-e p-2 text-start font-medium"
            >
              {t("student")}
            </th>
            {journal.lessons.map((lesson, col) => {
              const notTaken = !lesson.attendance_submitted && lesson.date <= today
              return (
                <th
                  key={lesson.id}
                  scope="col"
                  aria-colindex={col + 2}
                  className={cn(
                    "bg-muted sticky top-0 z-20 min-w-20 border-b p-1 align-top font-normal",
                    notTaken && "bg-muted/70",
                  )}
                >
                  <Link
                    href={lessonHref(lesson.id)}
                    className="hover:bg-accent focus-visible:ring-ring flex min-h-11 flex-col items-center gap-0.5 rounded-md p-1 text-center outline-none focus-visible:ring-2"
                  >
                    <span className="font-medium tabular-nums">
                      {f.date(lesson.date, { day: "numeric", month: "short" })}
                    </span>
                    <span className="text-muted-foreground line-clamp-2 text-xs">{lesson.topic ?? t("noTopic")}</span>
                    {notTaken ? (
                      <Badge variant="outline" className="text-xs">
                        {t("notTaken")}
                      </Badge>
                    ) : null}
                  </Link>
                </th>
              )
            })}
            <th
              scope="col"
              aria-colindex={cols + 2}
              className="bg-muted sticky top-0 z-20 border-b border-s p-2 text-center font-medium"
            >
              {t("absences")}
            </th>
            <th
              scope="col"
              aria-colindex={cols + 3}
              className="bg-muted sticky top-0 z-20 border-b p-2 text-center font-medium"
            >
              {t("semesterMark")}
            </th>
          </tr>
        </thead>
        {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- the arrow keys are handled once for every cell of the grid */}
        <tbody onKeyDown={onKeyDown}>
          {journal.students.map((student, row) => (
            <tr key={student.user_id} aria-rowindex={row + 2}>
              <th
                scope="row"
                aria-colindex={1}
                className="bg-background sticky left-0 z-10 min-w-36 border-b border-e p-2 text-start font-medium"
              >
                {fullName(student)}
              </th>
              {journal.lessons.map((lesson, col) => {
                const cell = student.cells.find((item) => item.lesson_id === lesson.id)
                const notTaken = !lesson.attendance_submitted && lesson.date <= today
                const key = `${lesson.id}:${student.user_id}`
                return (
                  <td
                    key={lesson.id}
                    aria-colindex={col + 2}
                    className={cn("border-b p-0.5 text-center", notTaken && "bg-muted/50")}
                    data-not-taken={notTaken}
                  >
                    {cell ? (
                      <JournalCell
                        cell={cell}
                        studentName={fullName(student)}
                        date={f.date(lesson.date, { day: "numeric", month: "short" })}
                        editable={lesson.editable}
                        notTaken={notTaken}
                        failed={failed.has(key)}
                        position={{ row, col }}
                        tabIndex={active.row === row && active.col === col ? 0 : -1}
                        onFocus={() => setActive({ row, col })}
                        onToggle={() =>
                          toggle.mutate(
                            {
                              lessonId: lesson.id,
                              studentId: student.user_id,
                              // present -> absent -> late -> present
                              absent: !cell.absent && !cell.late,
                              late: cell.absent,
                            },
                            { onError: (error) => onError(error, key), onSuccess: () => onSuccess(key) },
                          )
                        }
                      />
                    ) : null}
                  </td>
                )
              })}
              <td aria-colindex={cols + 2} className="border-b border-s p-2 text-center tabular-nums">
                {student.absences}
              </td>
              <td aria-colindex={cols + 3} className="border-b p-2 text-center">
                <MarkBadge mark={student.semester_mark} size="sm" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
