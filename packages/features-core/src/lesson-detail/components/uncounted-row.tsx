"use client"

import type { ReactNode } from "react"
import { useT } from "@ihsp/i18n"
import { fullName } from "../utils/people"
import type { AttendanceMark, Mark, SheetRosterItem } from "../utils/marks"
import { AttendanceSegmented } from "./attendance-segmented"

/**
 * A student without a subgroup in a subgroup lesson (ACA-2): counted only when the teacher marks them, so there are
 * a Present / Late / Absent control. Tapping the active one clears the mark again.
 */
export function UncountedRow({
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
  /** Shown under the student when marked absent: the work-off task. */
  children?: ReactNode
}) {
  const t = useT("lessonDetail.attendance")
  return (
    <li aria-label={fullName(item)} className="flex flex-col gap-2 rounded-lg border border-dashed p-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="min-w-0 truncate text-sm">{fullName(item)}</span>
        <AttendanceSegmented
          name={t("unassigned.markFor", { name: fullName(item) })}
          mark={mark}
          disabled={readOnly}
          clearable
          onMark={onMark}
        />
      </div>
      {mark === "absent" ? children : null}
    </li>
  )
}
