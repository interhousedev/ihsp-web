"use client";

import { useFormatters, useT } from "@ihsp/i18n";
import { useNow } from "../../../shared/hooks/use-now";
import { shortName } from "../../../shared/utils/people";
import { useToday } from "../../hooks/use-today";
import { remainingMinutes } from "../../utils/countdown";
import type { Widget } from "../model";
import { WidgetFrame } from "../widget-frame";

/** Next lesson: subject and countdown at 1x1; 2x1 adds time, room and materials; 2x2 adds the teacher. */
export function NowNextWidget({
  widget,
  editing,
}: {
  widget: Widget;
  editing?: boolean;
}) {
  const t = useT("today.now");
  const d = useT("today.dashboard");
  const f = useFormatters();
  const now = useNow();
  const query = useToday();
  const today = query.data;
  const lesson = today?.now_or_next ?? null;
  const running =
    lesson !== null &&
    today?.lessons.find((item) => item.id === lesson.id)?.state === "now";
  const minutes =
    lesson?.minutes_left == null
      ? null
      : remainingMinutes(lesson.minutes_left, query.dataUpdatedAt, now);
  const countdown =
    minutes === null
      ? null
      : running
        ? t("minutesLeft", { count: minutes })
        : t("startsIn", { count: minutes });
  const compact = widget.size === "1x1";
  const detailed = widget.size === "2x2";
  return (
    <WidgetFrame
      widget={widget}
      editing={editing}
      title={running ? t("titleNow") : t("titleNext")}
      href={
        lesson
          ? `/lessons/view/?id=${encodeURIComponent(lesson.id)}`
          : "/timetable/"
      }
    >
      {lesson ? (
        <>
          <span
            className={`leading-tight font-semibold ${compact ? "line-clamp-2 text-sm" : "truncate text-lg"}`}
          >
            {lesson.subject.name}
          </span>
          {countdown ? (
            <span className="text-xs font-medium" data-testid="next-countdown">
              {countdown}
            </span>
          ) : null}
          {!compact ? (
            <span className="text-xs opacity-80">
              {f.time(lesson.starts_at)}–{f.time(lesson.ends_at)}
              {lesson.room?.name
                ? ` · ${t("room", { name: lesson.room.name })}`
                : ""}
            </span>
          ) : null}
          {!compact ? (
            <span className="text-xs opacity-80">
              {t("materials", { count: lesson.materials_count })}
            </span>
          ) : null}
          {detailed && lesson.teacher ? (
            <span className="text-xs opacity-80">
              {shortName(lesson.teacher)}
            </span>
          ) : null}
        </>
      ) : (
        <span className="text-sm">{d("noLesson")}</span>
      )}
    </WidgetFrame>
  );
}
