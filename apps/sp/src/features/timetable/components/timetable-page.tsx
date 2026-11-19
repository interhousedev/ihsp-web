"use client"

import { NoStudentRecordNotice } from "../../shared/components/no-student-record-notice"
import { isRecordBlocked, useStudentRecordState } from "../../shared/hooks/use-student-record-state"
import { getMeLessonResultsQuery, getMeProfileQuery, getMeTimetableQuery, type StudentLessonItem } from "@ihsp/api"
import { startOfWeek, todayIso, useFormatters, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, cn, PageContainer, StateView, Switch, useIsMobile } from "@ihsp/ui"
import { useControlPeriods } from "../hooks/use-control-periods"
import { useShowOtherSubgroup } from "../hooks/use-show-other-subgroup"
import { useQuery } from "@tanstack/react-query"
import { parseAsString, useQueryState } from "nuqs"
import { useMemo, useState } from "react"
import type { ControlPeriodItem } from "@ihsp/api"
import { WorkOffCard } from "../../attendance/components/work-off-card"
import { AttendanceOverview } from "../../attendance/components/attendance-overview"
import { useAttendance } from "../../attendance/hooks/use-attendance"
import { dayStatus, type MarkedState } from "../../attendance/utils/lesson-states"
import { monthOf } from "../../attendance/utils/month-grid"
import { STATE_TONE } from "../../attendance/utils/state-tone"
import { CalendarFeedDialog } from "../../calendar-feed/components/calendar-feed-dialog"
import { BackLink, QueryState } from "@ihsp/features-core"
import { useNow } from "../../shared/hooks/use-now"
import { DESKTOP_PX_PER_MINUTE, PHONE_PX_PER_MINUTE } from "../utils/timeline"
import { isIsoDate, lessonsOn, studyDayOf, subgroupsOf, weekDays, weekRange } from "../utils/week"
import { parseView, stepDate, type CalendarView } from "../utils/view"
import { ControlPeriodDialog } from "./control-period-dialog"
import { CalendarToolbar } from "./calendar-toolbar"
import { LessonSheet } from "./lesson-sheet"
import { TimeGrid } from "./time-grid"
import { TimetableDayView } from "./timetable-day-view"
import { TimetableMonthView } from "./timetable-month-view"

const isOther = (lesson: StudentLessonItem) => lesson.subgroup?.is_own_subgroup === false

/**
 * The calendar (WEB-5, WEB-6, UF-WEB-03, UF-WEB-04, WEB-17): the lessons as a day or a week on a time axis, the
 * attendance of each lesson in its colour, the month with the attendance on its days, and the attendance counts. The
 * address keeps the view (`?view=day|week|month`) and the focus date (`?day=`).
 */
function TimetableContent() {
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
  // A weekend without lessons opens on the Monday after it; a weekend with lessons is a study day like any other.
  const todayWeek = useQuery(getMeTimetableQuery(weekRange(startOfWeek(today)))).data
  const focusToday = todayWeek?.some((lesson) => lesson.date === today) ? today : studyDayOf(today)
  const focus = isIsoDate(dayParam) ? dayParam : focusToday
  const focusWeek = useQuery(getMeTimetableQuery(weekRange(startOfWeek(focus)))).data
  const focusOpen = focusWeek?.some((lesson) => lesson.date === focus) ?? false
  // The day view opens a weekend picked explicitly (it shows the empty state); only the default focus skips it.
  const day = view === "day" && !focusOpen && !isIsoDate(dayParam) ? studyDayOf(focus) : focus
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
  const excusedLessonIds = useMemo(
    () => new Set((lessonsQuery.data ?? []).filter((lesson) => lesson.excused).map((lesson) => lesson.id)),
    [lessonsQuery.data],
  )
  const periods = useControlPeriods()
  const [lessonId, setLessonId] = useState<string | null>(null)
  const [opened, setOpened] = useState<ControlPeriodItem | null>(null)
  const { shown, setShown } = useShowOtherSubgroup()
  const pxPerMinute = isMobile ? PHONE_PX_PER_MINUTE : DESKTOP_PX_PER_MINUTE
  const legend: { state: MarkedState; label: string }[] = [
    { state: "present", label: ta("present") },
    { state: "late", label: ta("late") },
    { state: "absent", label: ta("absent") },
  ]

  return (
    <PageContainer
      title={t("title")}
      back={<BackLink href="/" label={t("backHome")} />}
      actions={<CalendarFeedDialog />}
    >
      <CalendarToolbar
        view={view}
        day={day}
        today={focusToday}
        onViewChange={(next) => void setView(next)}
        onStep={(direction) => void setDay(stepDate(view, day, direction, lessonsQuery.data))}
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
              periods={periods}
              onOpenPeriod={setOpened}
              onPickDay={(date) => {
                void setView("day")
                void setDay(date)
              }}
            />
          )}
        </QueryState>
      ) : (
        <QueryState query={lessonsQuery} rows={4}>
          {(allLessons) => {
            const hint = subgroupUnset && allLessons.some((lesson) => subgroupsOf(lesson).length > 0)
            const lessons = shown ? allLessons : allLessons.filter((lesson) => !isOther(lesson))
            return (
              <>
                {hint ? (
                  <Alert>
                    <AlertDescription>{t("subgroupHint")}</AlertDescription>
                  </Alert>
                ) : null}
                {shown || allLessons.some(isOther) ? (
                  <label className="flex min-h-11 w-fit items-center gap-2 text-sm md:min-h-8">
                    <Switch checked={shown} onCheckedChange={setShown} />
                    {t("showOtherSubgroup")}
                  </label>
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
                    excusedLessonIds={excusedLessonIds}
                    statuses={statuses}
                    periods={periods}
                    onOpenPeriod={setOpened}
                    onOpenLesson={setLessonId}
                    onDayChange={(next) => void setDay(next)}
                    onStep={(direction) => void setDay(stepDate("day", day, direction, allLessons))}
                  />
                ) : lessons.length === 0 ? (
                  <StateView state="empty" emptyText={t("noLessonsWeek")} />
                ) : (
                  <TimeGrid
                    columns={weekDays(monday, lessons).map((date) => ({
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
                    excusedLessonIds={excusedLessonIds}
                    periods={periods}
                    onOpenPeriod={setOpened}
                    onOpenLesson={setLessonId}
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
      <WorkOffCard />
      <LessonSheet lessonId={lessonId} title={t("sheet.close")} onClose={() => setLessonId(null)} />
      <ControlPeriodDialog period={opened} onClose={() => setOpened(null)} />
    </PageContainer>
  )
}

/** TimetablePage; a student without a usable academic record sees the explanation instead of the content. */
export function TimetablePage() {
  const t = useT("timetable")
  const record = useStudentRecordState()
  if (isRecordBlocked(record.status)) {
    return (
      <PageContainer title={t("title")}>
        <NoStudentRecordNotice reason={record.status} />
      </PageContainer>
    )
  }
  return <TimetableContent />
}
