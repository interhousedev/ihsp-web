"use client"

import { useFormatters, useT } from "@ihsp/i18n"
import { useToday } from "../../hooks/use-today"
import type { Widget } from "../model"
import { CardEmpty, WidgetFrame } from "../widget-frame"

export function NextLessonWidget({ widget, editing }: { widget: Widget; editing?: boolean }) {
  const t = useT("today.dashboard")
  const f = useFormatters()
  const query = useToday()
  const lesson = query.data?.now_or_next
  return (
    <WidgetFrame
      widget={widget}
      editing={editing}
      title={t("kinds.clock_next_lesson")}
      href={lesson ? `/lessons/view/?id=${encodeURIComponent(lesson.id)}` : "/timetable/"}
      status={query.isPending ? "loading" : query.isError ? "error" : undefined}
      onRetry={() => void query.refetch()}
    >
      {lesson ? (
        <>
          <span className="truncate text-lg leading-tight font-semibold">{lesson.subject.name}</span>
          <span className="text-xs opacity-80">
            {f.time(lesson.starts_at)}–{f.time(lesson.ends_at)}
            {lesson.room?.name ? ` · ${lesson.room.name}` : ""}
          </span>
        </>
      ) : (
        <CardEmpty text={t("noLesson")} />
      )}
    </WidgetFrame>
  )
}
