"use client"

import { useT } from "@ihsp/i18n"
import { Badge, cn } from "@ihsp/ui"
import { fullName } from "../utils/people"
import type { Mark, SheetRosterItem } from "../utils/marks"

/**
 * One student of the audience: a tap toggles "absent" (everyone starts present). In a read-only sheet the row is
 * plain text with the state and the excuse, if the curator gave one.
 */
export function RosterRow({
  item,
  mark,
  readOnly,
  onToggle,
}: {
  item: SheetRosterItem
  mark: Mark
  readOnly: boolean
  onToggle: () => void
}) {
  const t = useT("lessonDetail.attendance")
  const absent = mark === "absent"
  const name = fullName(item)
  const state = (
    <span className="flex shrink-0 items-center gap-1.5">
      {absent && item.excused ? <Badge variant="outline">{t("excused")}</Badge> : null}
      <Badge variant={absent ? "destructive" : "secondary"}>{absent ? t("absent") : t("present")}</Badge>
    </span>
  )
  const comment =
    absent && item.excused && item.excuse_comment ? (
      <span className="text-muted-foreground text-xs">{item.excuse_comment}</span>
    ) : null

  if (readOnly) {
    return (
      <li className="flex min-h-11 items-center justify-between gap-3 rounded-lg border p-2" data-absent={absent}>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm">{name}</span>
          {comment}
        </span>
        {state}
      </li>
    )
  }

  return (
    <li>
      <button
        type="button"
        aria-pressed={absent}
        onClick={onToggle}
        data-absent={absent}
        className={cn(
          "focus-visible:ring-ring flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border p-2 text-start outline-none focus-visible:ring-2",
          absent ? "border-destructive/50 bg-destructive/5" : "hover:bg-accent",
        )}
      >
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm">{name}</span>
          {comment}
        </span>
        {state}
      </button>
    </li>
  )
}
