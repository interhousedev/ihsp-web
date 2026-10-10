"use client"

import { useFormatters, useT } from "@ihsp/i18n"
import { useToday } from "../../hooks/use-today"
import type { Widget } from "../model"
import { WidgetFrame } from "../widget-frame"
import { Lines, listRows } from "./shared"

export function TimetableWidget({ widget, editing }: { widget: Widget; editing?: boolean }) {
  const t = useT("today.dashboard")
  const f = useFormatters()
  const lessons = (useToday().data?.lessons ?? []).filter((lesson) => lesson.status !== "cancelled")
  return (
    <WidgetFrame widget={widget} editing={editing} title={t("kinds.timetable")} href="/timetable/">
      {lessons.length === 0 ? (
        <span className="text-sm">{t("noLessons")}</span>
      ) : (
        <Lines
          items={lessons
            .slice(0, Math.max(listRows(widget) + 2, 2))
            .map((lesson) => `${f.time(lesson.starts_at)} ${lesson.subject.name}`)}
        />
      )}
    </WidgetFrame>
  )
}
