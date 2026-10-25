"use client"

import type { ReactNode } from "react"
import { useT } from "@ihsp/i18n"
import { Badge, cn } from "@ihsp/ui"
import { fullName } from "../utils/people"
import type { AttendanceMark, Mark, SheetRosterItem } from "../utils/marks"
import { AttendanceSegmented } from "./attendance-segmented"

/**
 * One student of the audience: a Present / Late / Absent control (everyone starts present). In a read-only sheet the
 * row is plain text with the state and the excuse, if the curator gave one.
 */
export function RosterRow({
  item,
  mark,
  readOnly,
  onMark,
  children,
}: {
  item: SheetRosterItem
  mark: Mark
  readOnly: boolean
  onMark: (mark: AttendanceMark) => void
  /** Shown under the student: the work-off task of an absent student. */
  children?: ReactNode
}) {
  const t = useT("lessonDetail.attendance")
  const absent = mark === "absent"
  const late = mark === "late"
  const name = fullName(item)
  const state = (
    <span className="flex shrink-0 items-center gap-1.5">
      {absent && item.excused ? <Badge variant="outline">{t("excused")}</Badge> : null}
      <Badge
        variant={absent ? "destructive" : "secondary"}
        className={cn(late && "bg-orange-600 text-white hover:bg-orange-600")}
      >
        {absent ? t("absent") : late ? t("late") : t("present")}
      </Badge>
    </span>
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
        absent ? "border-red-800/50 bg-red-700/5" : late ? "border-orange-600/50 bg-orange-600/5" : "bg-background",
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
