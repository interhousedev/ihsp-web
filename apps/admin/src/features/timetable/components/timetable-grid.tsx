"use client"

import type { Term, TimetableEntry } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import { STUDY_WEEKDAYS, weekdayDate } from "../../shared/utils/weekdays"
import { EntryChip, type TimetableView } from "./entry-chip"

/** The periods of a term (union over all weekdays), sorted. */
export function termPeriods(term: Term): number[] {
  return [...new Set(term.bells.map((bell) => bell.period))].toSorted((a, b) => a - b)
}

/** Start and end of a period on a weekday, or null when the bell schedule has none. */
export function bellTime(term: Term, period: number, weekday: number): string | null {
  const bell = term.bells.find((item) => item.period === period && item.weekdays.includes(weekday))
  return bell ? `${bell.start}–${bell.end}` : null
}

type Props = {
  term: Term
  entries: TimetableEntry[]
  view: TimetableView
  onAdd: (weekday: number, period: number) => void
  onOpen: (entry: TimetableEntry) => void
}

function cellEntries(entries: TimetableEntry[], weekday: number, period: number): TimetableEntry[] {
  return entries.filter((entry) => entry.weekday === weekday && entry.period === period)
}

/** Weekday × period grid (desktop and tablet). Each cell lists its entries and has an add button. */
export function TimetableGrid({ term, entries, view, onAdd, onOpen }: Props) {
  const t = useT("timetable")
  const f = useFormatters()
  const periods = termPeriods(term)
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[56rem] table-fixed border-collapse text-sm">
        <caption className="sr-only">{t("gridCaption")}</caption>
        <thead>
          <tr className="bg-muted">
            <th scope="col" className="w-24 p-2 text-start font-medium">
              {t("period")}
            </th>
            {STUDY_WEEKDAYS.map((weekday) => (
              <th key={weekday} scope="col" className="p-2 text-start font-medium">
                {f.weekday(weekdayDate(weekday), "long")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periods.map((period) => (
            <tr key={period} className="border-t align-top">
              <th scope="row" className="p-2 text-start font-medium">
                <span>{period}</span>
                <span className="text-muted-foreground block text-xs font-normal">
                  {bellTime(term, period, 1) ?? bellTime(term, period, 6) ?? ""}
                </span>
              </th>
              {STUDY_WEEKDAYS.map((weekday) => {
                const inCell = cellEntries(entries, weekday, period)
                const hasBell = bellTime(term, period, weekday) !== null
                return (
                  <td key={weekday} className={`p-1 ${hasBell ? "" : "bg-muted/40"}`}>
                    <div className="flex flex-col gap-1">
                      {inCell.map((entry) => (
                        <EntryChip key={entry.id} entry={entry} view={view} onOpen={() => onOpen(entry)} />
                      ))}
                      {hasBell ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground min-h-8 justify-start"
                          aria-label={t("addAt", { weekday: f.weekday(weekdayDate(weekday), "long"), period })}
                          onClick={() => onAdd(weekday, period)}
                        >
                          <Icons.add aria-hidden />
                        </Button>
                      ) : null}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
