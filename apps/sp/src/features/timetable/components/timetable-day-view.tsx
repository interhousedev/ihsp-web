"use client"

import type { ControlPeriodItem, LessonItem, LessonResult } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { DatePicker, StateView } from "@ihsp/ui"
import { useRef, type TouchEvent } from "react"
import type { MarkedState } from "../../attendance/utils/lesson-states"
import { periodEdge, periodOn } from "../utils/control-periods"
import { lessonsOn, weekDays } from "../utils/week"
import { PHONE_PX_PER_MINUTE } from "../utils/timeline"
import { ControlPeriodBar } from "./control-period-bar"
import { TimeGrid } from "./time-grid"
import { DayPills } from "./day-pills"

/** A horizontal swipe of at least this many px (and more horizontal than vertical) changes the day. */
const SWIPE_MIN_PX = 56
/** The day view always draws 08:00 to 18:00. */
const DAY_RANGE = { startMin: 8 * 60, endMin: 18 * 60 }

/**
 * One day as a calendar day view: the week strip to pick the day, then the time axis with the lessons placed by their
 * minutes. Swiping left and right moves to the next or previous day.
 */
export function TimetableDayView({
  day,
  monday,
  today,
  lessons,
  now,
  showSubgroup,
  results,
  excusedLessonIds,
  statuses,
  onDayChange,
  onStep,
  periods,
  onOpenPeriod,
  onOpenLesson,
}: {
  day: string
  monday: string
  today: string
  lessons: LessonItem[]
  now: number
  showSubgroup: boolean
  results: ReadonlyMap<string, LessonResult>
  excusedLessonIds: ReadonlySet<string>
  statuses: ReadonlyMap<string, MarkedState>
  onDayChange: (date: string) => void
  onStep: (direction: 1 | -1) => void
  periods: readonly ControlPeriodItem[]
  onOpenPeriod: (period: ControlPeriodItem) => void
  onOpenLesson: (lessonId: string) => void
}) {
  const t = useT("timetable")
  const f = useFormatters()
  const items = lessonsOn(lessons, day)
  const period = periodOn(periods, day)
  const start = useRef<{ x: number; y: number } | null>(null)

  function onTouchStart(event: TouchEvent) {
    const touch = event.touches[0]
    start.current = touch ? { x: touch.clientX, y: touch.clientY } : null
  }

  function onTouchEnd(event: TouchEvent) {
    const origin = start.current
    const touch = event.changedTouches[0]
    start.current = null
    if (!origin || !touch) return
    const dx = touch.clientX - origin.x
    const dy = touch.clientY - origin.y
    if (Math.abs(dx) >= SWIPE_MIN_PX && Math.abs(dx) > Math.abs(dy) * 1.5) onStep(dx < 0 ? 1 : -1)
  }

  return (
    <div className="flex flex-col gap-3" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-base font-semibold first-letter:uppercase">
          {f.date(day, { month: "long", year: "numeric" })}
        </p>
        <DatePicker
          iconOnly
          value={day}
          onChange={(date) => date && onDayChange(date)}
          aria-label={t("openCalendar")}
        />
      </div>
      <DayPills
        days={weekDays(monday, [{ date: day }])}
        selected={day}
        today={today}
        statuses={statuses}
        onChange={onDayChange}
      />
      {period ? (
        <ControlPeriodBar
          period={period}
          edge={periodEdge(period, day)}
          showLabel
          onOpen={() => onOpenPeriod(period)}
          className="rounded-md"
        />
      ) : null}
      {items.length === 0 ? (
        <StateView state="empty" emptyText={t("noLessons")} />
      ) : (
        <TimeGrid
          columns={[
            {
              key: day,
              label: f.weekday(day, "long"),
              sublabel: f.date(day, { day: "numeric", month: "long" }),
              today: day === today,
              lessons: items,
            },
          ]}
          pxPerMinute={PHONE_PX_PER_MINUTE}
          minColumnWidth={0}
          showHeaders={false}
          now={now}
          showSubgroup={showSubgroup}
          results={results}
          excusedLessonIds={excusedLessonIds}
          onOpenLesson={onOpenLesson}
          baseRange={DAY_RANGE}
        />
      )}
    </div>
  )
}
