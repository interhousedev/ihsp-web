"use client"

import { getMeAttendanceQuery, getMeTimetableQuery } from "@ihsp/api"
import { useT, todayIso } from "@ihsp/i18n"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { WeekPager } from "../../shared/components/week-pager"
import { schoolWeekOf, shiftWeek } from "../../homework/utils/week-paging"
import { weekSquares, type SquareState } from "../utils/week-squares"

const TONE: Record<SquareState, string> = {
  present: "bg-success",
  absent: "bg-destructive",
  excused: "bg-warning",
  not_taken: "bg-info",
  future: "bg-muted",
}

/** Attendance of one week as squares: one per lesson, Monday to Friday, coloured by state (a label for each state). */
export function AttendanceWeekSquares() {
  const t = useT("attendance.squares")
  const weekday = {
    mon: t("weekday.mon"),
    tue: t("weekday.tue"),
    wed: t("weekday.wed"),
    thu: t("weekday.thu"),
    fri: t("weekday.fri"),
  }
  const stateLabel: Record<SquareState, string> = {
    present: t("state.present"),
    absent: t("state.absent"),
    excused: t("state.excused"),
    not_taken: t("state.not_taken"),
    future: t("state.future"),
  }
  const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri"] as const
  const [range, setRange] = useState(() => schoolWeekOf(todayIso()))
  const lessons = useQuery(getMeTimetableQuery(range)).data ?? []
  const attendance = useQuery(getMeAttendanceQuery(range)).data
  const days = weekSquares(
    lessons,
    attendance?.missed.map((item) => ({ lessonId: item.lesson.id, excused: item.excused })) ?? [],
    todayIso(),
  )

  return (
    <section aria-labelledby="attendance-squares-title" className="flex flex-col gap-3">
      <h2 id="attendance-squares-title" className="text-base font-semibold">
        {t("title")}
      </h2>
      <WeekPager
        from={range.from}
        to={range.to}
        onPrevious={() => setRange(shiftWeek(range.from, -1))}
        onNext={() => setRange(shiftWeek(range.from, 1))}
        labels={{ previous: t("previousWeek"), next: t("nextWeek") }}
      />
      <div className="grid grid-cols-5 gap-2">
        {days.map((day, index) => (
          <div key={day.weekday} className="flex flex-col gap-2">
            <span className="text-muted-foreground text-xs">{weekday[WEEKDAYS[index] ?? "mon"]}</span>
            <div className="flex flex-wrap gap-1">
              {day.squares.map((square) => (
                <span
                  key={square.lessonId}
                  role="img"
                  aria-label={stateLabel[square.state]}
                  title={stateLabel[square.state]}
                  className={`size-6 rounded-sm md:size-7 ${TONE[square.state]}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
