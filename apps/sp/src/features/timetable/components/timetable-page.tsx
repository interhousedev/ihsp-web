"use client"

import { getMeLessonResultsQuery, getMeProfileQuery, getMeTimetableQuery } from "@ihsp/api"
import { startOfWeek, todayIso, useFormatters, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, PageContainer, cn, useIsMobile } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { parseAsString, useQueryState } from "nuqs"
import { useMemo } from "react"
import { AttendanceOverview } from "../../attendance/components/attendance-overview"
import { useAttendance } from "../../attendance/hooks/use-attendance"
import { dayStatus, type MarkedState } from "../../attendance/utils/lesson-states"
import { monthOf } from "../../attendance/utils/month-grid"
import { STATE_TONE } from "../../attendance/utils/state-tone"
import { CalendarFeedDialog } from "../../calendar-feed/components/calendar-feed-dialog"
import { QueryState } from "../../shared/components/query-state"
import { useNow } from "../../shared/hooks/use-now"
import { DESKTOP_PX_PER_MINUTE, PHONE_PX_PER_MINUTE } from "../utils/timeline"
import { isIsoDate, lessonsOn, studyDayOf, subgroupsOf, weekDays, weekRange } from "../utils/week"
import { parseView, stepDate, type CalendarView } from "../utils/view"
import { CalendarToolbar } from "./calendar-toolbar"
import { TimeGrid } from "./time-grid"
import { TimetableDayView } from "./timetable-day-view"
import { TimetableMonthView } from "./timetable-month-view"

/**
 * The calendar (WEB-5, WEB-6, UF-WEB-03, UF-WEB-04, WEB-17): the lessons as a day or a week on a time axis, the
 * attendance of each lesson in its colour, the month with the attendance on its days, and the attendance counts. The
 * address keeps the view (`?view=day|week|month`) and the focus date (`?day=`).
 */
export function TimetablePage() {
  const t = useT("timetable")
  const ta = useT("attendanceStates")
  const f = useFormatters()
  const isMobile = useIsMobile()
  const now = useNow()
  const [viewParam, setView] = useQueryState("view", parseAsString)
  const [dayParam, setDay] = useQueryState("day", parseAsString)
  const today = todayIso()
  // Phones open on the day, desktops on the week; the address overrides it.
  const view: CalendarView = parseView(viewParam) ?? (isMobile ? "day" : "week")
  // A weekend opens on the Monday after it: there are no lessons to show for today.
  const focusToday = studyDayOf(today)
  const focus = isIsoDate(dayParam) ? dayParam : focusToday
  // The day view has no Saturday or Sunday: a weekend address opens on the Monday after it.
  const day = view === "day" ? studyDayOf(focus) : focus
  const monday = startOfWeek(day)
  const month = monthOf(day)
  const range = weekRange(monday)
  const lessonsQuery = useQuery(getMeTimetableQuery(range))
  const resultRows = useQuery(getMeLessonResultsQuery(range)).data
  const results = useMemo(() => new Map((resultRows ?? []).map((row) => [row.lesson_id, row])), [resultRows])
  const statuses = useMemo(() => dayStatus(lessonsQuery.data ?? [], resultRows ?? []), [lessonsQuery.data, resultRows])
  const profile = useQuery(getMeProfileQuery())
  const subgroupUnset = profile.data?.subgroup === null
  const attendance = useAttendance(null, null)
  const pxPerMinute = isMobile ? PHONE_PX_PER_MINUTE : DESKTOP_PX_PER_MINUTE
  const legend: { state: MarkedState; label: string }[] = [
    { state: "present", label: ta("present") },
    { state: "late", label: ta("late") },
    { state: "absent", label: ta("absent") },
  ]

  return (
    <PageContainer title={t("title")} actions={<CalendarFeedDialog />}>
      <CalendarToolbar
        view={view}
        day={day}
        today={focusToday}
        onViewChange={(next) => void setView(next)}
        onStep={(direction) => void setDay(stepDate(view, day, direction))}
        onToday={() => void setDay(null)}
      />
      <ul className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs" aria-label={t("legend")}>
        {legend.map(({ state, label }) => (
          <li key={state} className="flex items-center gap-1.5">
            <span aria-hidden className={cn("size-2.5 rounded-full", STATE_TONE[state].dot)} />
            {label}
          </li>
        ))}
      </ul>
      {view === "month" ? (
        <QueryState query={attendance} rows={4}>
          {(data) => (
            <TimetableMonthView
              month={month}
              days={data.days}
              missed={data.missed}
              onMonthChange={(next) => void setDay(`${next}-01`)}
              onPickDay={(date) => {
                void setView("day")
                void setDay(date)
              }}
            />
          )}
        </QueryState>
      ) : (
        <QueryState query={lessonsQuery} rows={4}>
          {(lessons) => {
            const hint = subgroupUnset && lessons.some((lesson) => subgroupsOf(lesson).length > 0)
            return (
              <>
                {hint ? (
                  <Alert>
                    <AlertDescription>{t("subgroupHint")}</AlertDescription>
                  </Alert>
                ) : null}
                {view === "day" ? (
                  <TimetableDayView
                    day={day}
                    monday={monday}
                    today={today}
                    lessons={lessons}
                    now={now}
                    showSubgroup={hint}
                    results={results}
                    statuses={statuses}
                    onDayChange={(next) => void setDay(next)}
                    onStep={(direction) => void setDay(stepDate("day", day, direction))}
                  />
                ) : lessons.length === 0 ? (
                  <p className="text-muted-foreground text-sm">{t("noLessonsWeek")}</p>
                ) : (
                  <TimeGrid
                    columns={weekDays(monday).map((date) => ({
                      key: date,
                      label: f.weekday(date, "short"),
                      sublabel: f.date(date, { day: "numeric", month: "short" }),
                      today: date === today,
                      lessons: lessonsOn(lessons, date),
                    }))}
                    pxPerMinute={pxPerMinute}
                    minColumnWidth={isMobile ? 96 : 140}
                    now={now}
                    showSubgroup={hint}
                    results={results}
                  />
                )}
              </>
            )
          }}
        </QueryState>
      )}
      <QueryState query={attendance} rows={4}>
        {(data) => <AttendanceOverview data={data} month={month} />}
      </QueryState>
    </PageContainer>
  )
}
