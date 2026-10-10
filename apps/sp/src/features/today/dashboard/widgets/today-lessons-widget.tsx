"use client"

import { useFormatters, useT } from "@ihsp/i18n"
import { useToday } from "../../hooks/use-today"
import { spanOf, type Widget } from "../model"
import { WidgetFrame } from "../widget-frame"

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
  const lessons = useToday().data?.lessons ?? []
  const wide = spanOf(widget.size).rows > 1
  return (
    <WidgetFrame widget={widget} editing={editing} title={t("title")} href="/timetable/">
      {lessons.length === 0 ? (
        <span className="text-sm">{d("noLessons")}</span>
      ) : (
        <ul className="flex min-h-0 flex-col gap-0.5 text-xs">
          {lessons.slice(0, capacity(widget)).map((lesson) => (
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
      )}
    </WidgetFrame>
  )
}
