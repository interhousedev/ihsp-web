"use client"

import type { Term, TimetableEntry } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import { TOUCH } from "../../shared/utils/touch"
import { STUDY_WEEKDAYS, weekdayDate } from "../../shared/utils/weekdays"
import { EntryChip, type TimetableView } from "./entry-chip"
import { bellTime, termPeriods } from "./timetable-grid"

/** The phone layout of the timetable: one card per weekday, one row per period. */
export function TimetableDayList({
  term,
  entries,
  view,
  onAdd,
  onOpen,
}: {
  term: Term
  entries: TimetableEntry[]
  view: TimetableView
  onAdd: (weekday: number, period: number) => void
  onOpen: (entry: TimetableEntry) => void
}) {
  const t = useT("timetable")
  const f = useFormatters()
  const periods = termPeriods(term)
  return (
    <div className="flex flex-col gap-4">
      {STUDY_WEEKDAYS.map((weekday) => {
        const dayName = f.weekday(weekdayDate(weekday), "long")
        return (
          <section key={weekday} aria-label={dayName} className="rounded-lg border">
            <h3 className="bg-muted rounded-t-lg px-3 py-2 text-sm font-semibold">{dayName}</h3>
            <ul className="divide-y">
              {periods
                .filter((period) => bellTime(term, period, weekday) !== null)
                .map((period) => (
                  <li key={period} className="flex flex-col gap-1 p-2">
                    <p className="text-muted-foreground text-xs">
                      {period}. {bellTime(term, period, weekday)}
                    </p>
                    {entries
                      .filter((entry) => entry.weekday === weekday && entry.period === period)
                      .map((entry) => (
                        <EntryChip key={entry.id} entry={entry} view={view} onOpen={() => onOpen(entry)} />
                      ))}
                    <Button
                      type="button"
                      variant="ghost"
                      className={`${TOUCH} text-muted-foreground justify-start`}
                      aria-label={t("addAt", { weekday: dayName, period })}
                      onClick={() => onAdd(weekday, period)}
                    >
                      <Icons.add aria-hidden />
                      {t("add")}
                    </Button>
                  </li>
                ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
