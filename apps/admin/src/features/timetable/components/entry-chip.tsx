"use client"

import type { TimetableEntry } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { audienceLabel } from "../../shared/utils/names"

export type TimetableView = "group" | "teacher" | "room"

/** What an entry shows depends on the view: the thing you already filtered by is left out. */
function details(entry: TimetableEntry, view: TimetableView): string[] {
  const teacher = entry.teacher?.last_name
  const room = entry.room?.name
  const audience = audienceLabel(entry.audience)
  if (view === "teacher") return [audience, room ?? ""]
  if (view === "room") return [teacher ?? "", audience]
  const subgroups = entry.audience.filter((item) => item.subgroup !== null).map((item) => item.subgroup)
  return [teacher ?? "", room ?? "", subgroups.length > 0 ? subgroups.join("+") : ""]
}

/** One entry in a grid cell; opens the editor. */
export function EntryChip({ entry, view, onOpen }: { entry: TimetableEntry; view: TimetableView; onOpen: () => void }) {
  const t = useT("timetable")
  const parity = entry.week_parity === "every" ? null : t(`parityShort.${entry.week_parity}`)
  return (
    <button
      type="button"
      onClick={onOpen}
      className="bg-secondary/60 hover:bg-secondary focus-visible:ring-ring flex min-h-11 w-full flex-col items-start rounded-md px-2 py-1 text-start text-xs outline-none focus-visible:ring-2 md:min-h-0"
      aria-label={t("openEntry", { subject: entry.subject.name })}
    >
      <span className="font-medium">
        {entry.subject.short_name || entry.subject.name}
        {parity ? <span className="text-muted-foreground ms-1 font-normal">({parity})</span> : null}
      </span>
      <span className="text-muted-foreground">{details(entry, view).filter(Boolean).join(" · ")}</span>
    </button>
  )
}
