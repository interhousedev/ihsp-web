"use client"

import { getMeTimetableQuery } from "@ihsp/api"
import { todayIso, useFormatters, useT } from "@ihsp/i18n"
import { useQuery } from "@tanstack/react-query"
import { lessonsOn } from "../../../timetable/utils/week"
import { nextStudyDay, todayIsOver } from "../../utils/next-study-day"
import { useToday } from "../../hooks/use-today"
import { spanOf, type Widget } from "../model"
import { CardEmpty, WidgetFrame } from "../widget-frame"

/** How many lessons a tile has room for. */
function capacity(widget: Widget): number {
  const { rows } = spanOf(widget.size)
  return rows <= 1 ? 3 : rows * 5
}

/** Today's lessons in order; done ones are dimmed, the current one is highlighted, cancelled ones are struck through. */
export function TodayLessonsWidget({ widget, editing }: { widget: Widget; editing?: boolean }) {
  const t = useT("today.timeline")
  const d = useT("today.dashboard")
  const f = useFormatters()
  const query = useToday()
  const todayLessons = query.data?.lessons ?? []
  // Nothing left today (weekend, holiday, after the last lesson): show the next study day instead.
  const over = query.data !== undefined && todayIsOver(todayLessons)
  const day = nextStudyDay(query.data?.next_study_day ?? null, todayIso())
  const next = useQuery({ ...getMeTimetableQuery({ from: day, to: day }), enabled: over })
  const upcoming = over ? lessonsOn(next.data ?? [], day) : []
  const showNext = over && upcoming.length > 0
  const lessons = showNext ? upcoming.map((lesson) => ({ ...lesson, state: "later" as const })) : todayLessons
  const wide = spanOf(widget.size).rows > 1
  return (
    <WidgetFrame
      widget={widget}
      editing={editing}
      title={t("title")}
      href="/timetable/"
      status={
        query.isPending || (over && next.isPending)
          ? "loading"
          : query.isError || (over && next.isError)
            ? "error"
            : undefined
      }
      onRetry={() => void (query.isError ? query.refetch() : next.refetch())}
    >
      {lessons.length === 0 ? (
        <CardEmpty text={d("noLessons")} />
      ) : (
        <>
          {showNext ? (
            <p data-testid="next-study-day" className="truncate text-xs font-medium opacity-80">
              {d("nextStudyDay", { day: f.date(day, { weekday: "short", day: "numeric", month: "short" }) })}
            </p>
          ) : null}
          <ul className="flex min-h-0 flex-col gap-0.5 text-xs">
            {lessons.slice(0, showNext ? capacity(widget) - 1 : capacity(widget)).map((lesson) => (
              <li
                key={lesson.id}
                data-lesson-state={lesson.state}
                aria-current={lesson.state === "now" ? "true" : undefined}
                className={`flex items-baseline gap-2 truncate rounded-md px-1 py-0.5 ${
                  lesson.state === "now"
                    ? "bg-primary text-primary-foreground font-semibold"
                    : lesson.state === "done"
                      ? "opacity-60"
                      : lesson.state === "cancelled"
                        ? "line-through opacity-60"
                        : ""
                }`}
              >
                <span className="tabular-nums">{f.time(lesson.starts_at)}</span>
                <span className="truncate">{lesson.subject.name}</span>
                {wide && lesson.room?.name ? (
                  <span className="ml-auto shrink-0 opacity-80">{lesson.room.name}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      )}
    </WidgetFrame>
  )
}
