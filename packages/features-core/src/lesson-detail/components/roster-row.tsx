"use client"

import type { ReactNode } from "react"
import { cn } from "@ihsp/ui"
import { fullName } from "../utils/people"
import type { AttendanceMark, Mark, SheetRosterItem } from "../utils/marks"
import { AttendanceSegmented } from "./attendance-segmented"
import { AttendanceStatus } from "./attendance-status"

/**
 * One student of the audience: a Present / Late / Absent control (everyone starts present). In a read-only sheet the
 * row is plain text with the shared status (tick, "нб", ...) and the excuse, if the curator gave one. `notTaken` shows
 * a dash instead of a tick: the lesson has no submitted attendance yet.
 */
export function RosterRow({
  item,
  mark,
  readOnly,
  notTaken = false,
  onMark,
  children,
}: {
  item: SheetRosterItem
  mark: Mark
  readOnly: boolean
  notTaken?: boolean
  onMark: (mark: AttendanceMark) => void
  /** Shown under the student: the work-off task of an absent student. */
  children?: ReactNode
}) {
  const absent = mark === "absent"
  const late = mark === "late"
  const name = fullName(item)
  const state = (
    <AttendanceStatus
      state={absent ? (item.excused ? "excused" : "absent") : late ? "late" : "present"}
      notTaken={notTaken}
    />
  )
  const comment =
    absent && item.excused && item.excuse_comment ? (
      <span className="text-muted-foreground text-xs">{item.excuse_comment}</span>
    ) : null

  if (readOnly) {
    return (
      <li
        aria-label={name}
        className="flex min-h-11 flex-col justify-center gap-1.5 rounded-lg border p-2"
        data-absent={absent}
        data-late={late}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm">{name}</span>
            {comment}
          </span>
          {state}
        </div>
        {absent ? children : null}
      </li>
    )
  }

  return (
    <li
      aria-label={name}
      data-absent={absent}
      data-late={late}
      className={cn(
        "flex flex-col gap-2 rounded-lg border p-2",
        absent ? "border-destructive bg-destructive-muted" : late ? "border-warning bg-warning-muted" : "bg-background",
      )}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm">{name}</span>
          {comment}
        </span>
        <AttendanceSegmented name={name} mark={mark} onMark={onMark} />
      </div>
      {absent ? children : null}
    </li>
  )
}
