"use client"

import type { Term, TimetableEntry } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Button, Icons, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@ihsp/ui"
import { ALL_WEEKDAYS, STUDY_WEEKDAYS, weekdayDate } from "../../shared/utils/weekdays"
import { EntryChip, type TimetableView } from "./entry-chip"

/** Monday to Friday, plus Saturday and Sunday once they have blocks or entries. */
export function termWeekdays(term: Term, entries: TimetableEntry[] = []): number[] {
  return ALL_WEEKDAYS.filter(
    (day) =>
      STUDY_WEEKDAYS.some((study) => study === day) ||
      term.bells.some((bell) => bell.weekdays.includes(day)) ||
      entries.some((entry) => entry.weekday === day),
  )
}

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
  const days = termWeekdays(term, entries)
  return (
    <div className="min-w-0 overflow-hidden rounded-lg border">
      <Table className="min-w-[56rem] table-fixed border-collapse">
        <caption className="sr-only">{t("gridCaption")}</caption>
        <TableHeader>
          <TableRow className="bg-muted">
            <TableHead scope="col" className="w-24 p-2 text-start font-medium">
              {t("period")}
            </TableHead>
            {days.map((weekday) => (
              <TableHead key={weekday} scope="col" className="p-2 text-start font-medium">
                {f.weekday(weekdayDate(weekday), "long")}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {periods.map((period) => (
            <TableRow key={period} className="align-top">
              <TableHead scope="row" className="p-2 text-start font-medium">
                <span>{period}</span>
              </TableHead>
              {days.map((weekday) => {
                const inCell = cellEntries(entries, weekday, period)
                const time = bellTime(term, period, weekday)
                const hasBell = time !== null
                return (
                  <TableCell key={weekday} className={`p-1 ${hasBell ? "" : "bg-muted/40"}`}>
                    <div className="flex flex-col gap-1">
                      {time ? <span className="text-muted-foreground px-1 text-xs">{time}</span> : null}
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
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
