"use client"

import { useT } from "@ihsp/i18n"
import { Button, cn } from "@ihsp/ui"
import { fullName } from "../utils/people"
import type { Mark, SheetRosterItem } from "../utils/marks"

/**
 * A student without a subgroup in a subgroup lesson (ACA-2): counted only when the teacher marks them, so there are
 * two buttons, Present and Absent. Tapping the active one clears the mark again.
 */
export function UncountedRow({
  item,
  mark,
  readOnly,
  onMark,
}: {
  item: SheetRosterItem
  mark: Mark
  readOnly: boolean
  onMark: (mark: "present" | "absent") => void
}) {
  const t = useT("lessonDetail.attendance")
  return (
    <li
      aria-label={fullName(item)}
      className="flex min-h-11 flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed p-2"
    >
      <span className="min-w-0 truncate text-sm">{fullName(item)}</span>
      <span
        className="flex shrink-0 gap-1.5"
        role="group"
        aria-label={t("unassigned.markFor", { name: fullName(item) })}
      >
        <Button
          type="button"
          variant={mark === "present" ? "default" : "outline"}
          aria-pressed={mark === "present"}
          disabled={readOnly}
          className={cn("min-h-11 md:min-h-8")}
          onClick={() => onMark("present")}
        >
          {t("present")}
        </Button>
        <Button
          type="button"
          variant={mark === "absent" ? "destructive" : "outline"}
          aria-pressed={mark === "absent"}
          disabled={readOnly}
          className={cn("min-h-11 md:min-h-8")}
          onClick={() => onMark("absent")}
        >
          {t("absent")}
        </Button>
      </span>
    </li>
  )
}
