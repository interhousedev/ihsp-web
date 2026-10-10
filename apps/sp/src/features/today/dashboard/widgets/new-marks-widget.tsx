"use client";

import { useUpdatePreferences } from "@ihsp/features-core";
import { useFormatters, useT } from "@ihsp/i18n";
import { useEffect, useRef } from "react";
import { useStickyList } from "../../hooks/use-sticky-list";
import { useToday } from "../../hooks/use-today";
import type { Widget } from "../model";
import { WidgetFrame } from "../widget-frame";
import { BigNumber, Lines, listRows } from "./shared";

/** Marks since the last visit: the count, and from 2x1 up the subject, mark and date of each. */
export function NewMarksWidget({
  widget,
  editing,
}: {
  widget: Widget;
  editing?: boolean;
}) {
  const t = useT("today.marks");
  const d = useT("today.dashboard");
  const f = useFormatters();
  const marks = useStickyList(useToday().data?.new_marks);
  const { mutate } = useUpdatePreferences();
  const recorded = useRef(false);

  // Once the marks are on screen the visit is recorded (`seen_marks_at`), so the next visit starts from here.
  useEffect(() => {
    if (recorded.current || editing || marks.length === 0) return;
    recorded.current = true;
    mutate({ seen_marks_at: new Date().toISOString() });
  }, [marks.length, editing, mutate]);
  return (
    <WidgetFrame
      widget={widget}
      editing={editing}
      title={t("title")}
      href="/grades/"
    >
      {marks.length === 0 ? (
        <span className="text-sm">{d("noNewMarks")}</span>
      ) : widget.size === "1x1" ? (
        <BigNumber value={marks.length} label={d("newMarks")} />
      ) : (
        <Lines
          items={marks
            .slice(0, listRows(widget) + 1)
            .map(
              (mark) =>
                `${mark.value} · ${mark.subject.name} · ${f.date(mark.date, { day: "numeric", month: "short" })}`,
            )}
        />
      )}
    </WidgetFrame>
  );
}
