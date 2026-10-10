"use client"

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
}: {
  item: SheetRosterItem
  mark: Mark
  readOnly: boolean
  onMark: (mark: AttendanceMark) => void
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
        className="flex min-h-11 items-center justify-between gap-3 rounded-lg border p-2"
        data-absent={absent}
        data-late={late}
      >
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm">{name}</span>
          {comment}
        </span>
        {state}
      </li>
    )
  }

  return (
    <li
      data-absent={absent}
      data-late={late}
      className={cn(
        "flex flex-col gap-2 rounded-lg border p-2 sm:flex-row sm:items-center sm:gap-3",
        absent ? "border-red-800/50 bg-red-700/5" : late ? "border-orange-600/50 bg-orange-600/5" : "bg-background",
      )}
    >
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm">{name}</span>
        {comment}
      </span>
      <AttendanceSegmented name={name} mark={mark} onMark={onMark} />
    </li>
  )
}
