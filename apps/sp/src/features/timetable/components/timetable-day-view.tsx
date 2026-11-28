"use client"

import type { ControlPeriodItem, LessonResult, StudentLessonItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { DatePicker, StateView } from "@ihsp/ui"
import { useRef, type TouchEvent } from "react"
import type { MarkedState } from "../../attendance/utils/lesson-states"
import type { DayBlockItem } from "../api/day-blocks"
import { periodEdge, periodOn } from "../utils/control-periods"
import { lessonsOn, weekDays } from "../utils/week"
import { ControlPeriodBar } from "./control-period-bar"
import { DayAgenda } from "./day-agenda"
import { DayPills } from "./day-pills"

/** A horizontal swipe of at least this many px (and more horizontal than vertical) changes the day. */
const SWIPE_MIN_PX = 56

/**
 * One day as an agenda: the week strip and the date picker in one row, then the lessons in time order with the
 * lunches, breaks and free time between them as compact rows. Swiping left and right moves to the next or previous day.
 */
export function TimetableDayView({
  day,
  monday,
  today,
  lessons,
  blocks,
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
  lessons: StudentLessonItem[]
  blocks: readonly DayBlockItem[]
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
  const items = lessonsOn(lessons, day)
  const dayBlocks = blocks.filter((block) => block.date === day)
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
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <DayPills
            days={weekDays(monday, [{ date: day }])}
            selected={day}
            today={today}
            statuses={statuses}
            onChange={onDayChange}
          />
        </div>
        <DatePicker
          iconOnly
          value={day}
          onChange={(date) => date && onDayChange(date)}
          aria-label={t("openCalendar")}
        />
      </div>
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
        <DayAgenda
          lessons={items}
          blocks={dayBlocks}
          now={now}
          showSubgroup={showSubgroup}
          results={results}
          excusedLessonIds={excusedLessonIds}
          onOpenLesson={onOpenLesson}
        />
      )}
    </div>
  )
}
