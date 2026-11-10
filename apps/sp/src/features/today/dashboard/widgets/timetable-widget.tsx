"use client"

import { useFormatters, useT } from "@ihsp/i18n"
import { useToday } from "../../hooks/use-today"
import type { Widget } from "../model"
import { CardEmpty, WidgetFrame } from "../widget-frame"
import { Lines, listRows } from "./shared"

export function TimetableWidget({ widget, editing }: { widget: Widget; editing?: boolean }) {
  const t = useT("today.dashboard")
  const f = useFormatters()
  const query = useToday()
  const lessons = (query.data?.lessons ?? []).filter((lesson) => lesson.status !== "cancelled")
  return (
    <WidgetFrame
      widget={widget}
      editing={editing}
      title={t("kinds.timetable")}
      href="/timetable/"
      status={query.isPending ? "loading" : query.isError ? "error" : undefined}
      onRetry={() => void query.refetch()}
    >
      {lessons.length === 0 ? (
        <CardEmpty text={t("noLessons")} />
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
