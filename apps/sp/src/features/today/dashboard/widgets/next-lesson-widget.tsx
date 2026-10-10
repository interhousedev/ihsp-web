"use client";

import { useFormatters, useT } from "@ihsp/i18n";
import { useToday } from "../../hooks/use-today";
import type { Widget } from "../model";
import { WidgetFrame } from "../widget-frame";

export function NextLessonWidget({
  widget,
  editing,
}: {
  widget: Widget;
  editing?: boolean;
}) {
  const t = useT("today.dashboard");
  const f = useFormatters();
  const lesson = useToday().data?.now_or_next;
  return (
    <WidgetFrame
      widget={widget}
      editing={editing}
      title={t("kinds.clock_next_lesson")}
      href={
        lesson
          ? `/lessons/view/?id=${encodeURIComponent(lesson.id)}`
          : "/timetable/"
      }
    >
      {lesson ? (
        <>
          <span className="truncate text-lg leading-tight font-semibold">
            {lesson.subject.name}
          </span>
          <span className="text-xs opacity-80">
            {f.time(lesson.starts_at)}–{f.time(lesson.ends_at)}
            {lesson.room?.name ? ` · ${lesson.room.name}` : ""}
          </span>
        </>
      ) : (
        <span className="text-sm">{t("noLesson")}</span>
      )}
    </WidgetFrame>
  );
}
