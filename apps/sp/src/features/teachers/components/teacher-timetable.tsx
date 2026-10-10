"use client"

import type { TeacherSlot } from "@ihsp/api"
import { addDays, startOfWeek, todayIso, useFormatters, useT, type IsoDate } from "@ihsp/i18n"
import { Badge, Button, Icons, cn } from "@ihsp/ui"
import { parseAsString, useQueryState } from "nuqs"
import Link from "next/link"
import { QueryState } from "../../shared/components/query-state"
import { studyDayOf } from "../../timetable/utils/week"
import { useTeacherTimetable } from "../hooks/use-my-teacher"
import { lessonHref } from "../utils/teacher-display"

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const WEEKDAYS = [0, 1, 2, 3, 4] as const

/**
 * The teacher's lessons in every group, Monday to Friday of one week (`?week=` any day of it; this week by default).
 * On a weekend "this week" is the week after, as in the calendar (`studyDayOf`).
 * The student's own group is highlighted; the other groups are muted and show their group name.
 */
export function TeacherTimetable({ teacherId }: { teacherId: string }) {
  const t = useT("teachers.detail")
  const format = useFormatters()
  const [week, setWeek] = useQueryState("week", parseAsString)
  const today = todayIso()
  const thisMonday = startOfWeek(studyDayOf(today))
  const monday = week && ISO_DATE.test(week) ? startOfWeek(week) : thisMonday
  const friday = addDays(monday, 4)
  const days = WEEKDAYS.map((offset) => addDays(monday, offset))
  const query = useTeacherTimetable(teacherId, monday, friday)

  function show(date: IsoDate) {
    void setWeek(date === thisMonday ? null : date)
  }

  return (
    <section aria-labelledby="teacher-timetable" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="teacher-timetable" className="text-lg font-semibold">
          {t("timetable")}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={t("previousWeek")}
            className="min-h-11 md:min-h-8"
            onClick={() => show(addDays(monday, -7))}
          >
            <Icons.chevronLeft aria-hidden />
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 md:min-h-8"
            disabled={monday === thisMonday}
            onClick={() => show(thisMonday)}
          >
            {t("thisWeek")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={t("nextWeek")}
            className="min-h-11 md:min-h-8"
            onClick={() => show(addDays(monday, 7))}
          >
            <Icons.chevronRight aria-hidden />
          </Button>
          <span className="text-muted-foreground text-sm">
            {format.date(monday, { day: "numeric", month: "short" })} –{" "}
            {format.date(friday, { day: "numeric", month: "short" })}
          </span>
        </div>
      </div>
      <QueryState query={query} rows={3}>
        {(slots) => (
          <div className="grid gap-3 md:grid-cols-5">
            {days.map((date) => (
              <DayColumn key={date} date={date} today={today} slots={slots.filter((slot) => slot.date === date)} />
            ))}
          </div>
        )}
      </QueryState>
    </section>
  )
}

function DayColumn({ date, today, slots }: { date: IsoDate; today: IsoDate; slots: TeacherSlot[] }) {
  const t = useT("teachers.detail")
  const format = useFormatters()
  return (
    <section
      aria-label={format.weekday(date, "long")}
      data-testid="teacher-day"
      className={cn("bg-card flex flex-col gap-2 rounded-xl border p-3", date === today && "border-primary")}
    >
      <h3 className="text-sm font-semibold">
        {format.weekday(date, "long")}{" "}
        <span className="text-muted-foreground font-normal">
          {format.date(date, { day: "numeric", month: "short" })}
        </span>
      </h3>
      {slots.length === 0 ? <p className="text-muted-foreground text-sm">{t("noLessonsDay")}</p> : null}
      <ul className="flex flex-col gap-2">
        {slots.map((slot) => (
          <SlotItem key={slot.id} slot={slot} />
        ))}
      </ul>
    </section>
  )
}

function SlotItem({ slot }: { slot: TeacherSlot }) {
  const t = useT("teachers.detail")
  const format = useFormatters()
  const cancelled = slot.status === "cancelled"
  const title = `${format.time(slot.starts_at)}–${format.time(slot.ends_at)} · ${slot.subject_name}`
  return (
    <li
      data-testid="teacher-slot"
      data-mine={slot.mine ? "true" : "false"}
      className={cn(
        "flex flex-col gap-0.5 rounded-lg border p-2 text-sm",
        slot.mine ? "border-primary bg-primary/5" : "bg-muted/40 text-muted-foreground",
      )}
    >
      {slot.lesson_id ? (
        <Link
          href={lessonHref(slot.lesson_id)}
          className={cn("font-medium hover:underline", cancelled && "line-through")}
        >
          {title}
        </Link>
      ) : (
        <span className={cn("font-medium", cancelled && "line-through")}>{title}</span>
      )}
      <span>{[slot.group, slot.room ? t("room", { room: slot.room }) : null].filter(Boolean).join(" · ")}</span>
      {slot.mine || cancelled ? (
        <span className="flex flex-wrap gap-1">
          {slot.mine ? <Badge>{t("yourGroup")}</Badge> : null}
          {cancelled ? <Badge variant="destructive">{t("cancelled")}</Badge> : null}
        </span>
      ) : null}
    </li>
  )
}
