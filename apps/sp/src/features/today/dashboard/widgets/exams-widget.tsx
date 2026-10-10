"use client";

import { todayIso, useT } from "@ihsp/i18n";
import { useMemo } from "react";
import { useExamLabels } from "../../../exams/hooks/use-exam-labels";
import { useExamsAhead } from "../../../exams/hooks/use-exams";
import { EXAMS_HREF } from "../../../exams/utils/hrefs";
import { nextControls } from "../../../exams/utils/next-controls";
import type { Widget } from "../model";
import { WidgetFrame } from "../widget-frame";
import { Lines, listRows } from "./shared";

const DAYS_AHEAD = 30;

export function ExamsWidget({
  widget,
  editing,
}: {
  widget: Widget;
  editing?: boolean;
}) {
  const t = useT("today.dashboard");
  const labels = useExamLabels();
  const query = useExamsAhead(todayIso(), DAYS_AHEAD);
  const [next, ...others] = useMemo(
    () => nextControls(query.data?.items ?? []),
    [query.data],
  );
  return (
    <WidgetFrame
      widget={widget}
      editing={editing}
      title={t("kinds.exams")}
      href={EXAMS_HREF}
    >
      {next ? (
        <>
          <span className="line-clamp-2 text-sm leading-tight font-semibold">
            {labels.name(next)}
          </span>
          <span className="text-xs opacity-80">{labels.countdown(next)}</span>
          {widget.size !== "1x1" ? (
            <Lines
              items={others
                .slice(0, listRows(widget))
                .map((item) => labels.name(item))}
            />
          ) : null}
        </>
      ) : (
        <span className="text-sm">{t("noExams")}</span>
      )}
    </WidgetFrame>
  );
}
