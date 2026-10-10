"use client";

import type { AssessmentItem } from "@ihsp/api";
import { todayIso, useT } from "@ihsp/i18n";
import { useMemo } from "react";
import { ExamBadges } from "../../../exams/components/exam-badges";
import { useExamLabels } from "../../../exams/hooks/use-exam-labels";
import { useExamsAhead } from "../../../exams/hooks/use-exams";
import { EXAMS_HREF } from "../../../exams/utils/hrefs";
import { nextControls } from "../../../exams/utils/next-controls";
import { useNow } from "../../../shared/hooks/use-now";
import type { Widget } from "../model";
import { WidgetFrame } from "../widget-frame";
import { listRows } from "./shared";

const DAYS_AHEAD = 14;

/** The next control (ПК/ИК) with its countdown; wider tiles add the date and the controls after it. */
export function UpcomingControlsWidget({
  widget,
  editing,
}: {
  widget: Widget;
  editing?: boolean;
}) {
  const t = useT("exams.card");
  const d = useT("today.dashboard");
  const labels = useExamLabels();
  const today = todayIso(useNow(60_000));
  const query = useExamsAhead(today, DAYS_AHEAD);
  const [next, ...others] = useMemo(
    () => nextControls(query.data?.items ?? []),
    [query.data],
  );
  const headline = (item: AssessmentItem) =>
    t("headline", {
      control: labels.control(item),
      subject: item.subject.name,
      when: labels.countdown(item),
    });
  return (
    <WidgetFrame
      widget={widget}
      editing={editing}
      title={t("title")}
      href={EXAMS_HREF}
    >
      {next ? (
        <>
          <span
            className="line-clamp-2 text-sm leading-tight font-semibold"
            data-testid="exam-next"
          >
            {headline(next)}
          </span>
          {widget.size !== "1x1" ? (
            <span className="text-xs opacity-80">{labels.when(next)}</span>
          ) : null}
          {widget.size === "2x2" ? (
            <>
              <ExamBadges item={next} />
              <ul className="flex min-h-0 flex-col gap-0.5 text-xs">
                {others.slice(0, listRows(widget)).map((item) => (
                  <li
                    key={item.id}
                    data-testid="exam-next-item"
                    className="flex flex-wrap items-center gap-x-2"
                  >
                    <span className="truncate">{headline(item)}</span>
                    <ExamBadges item={item} />
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </>
      ) : (
        <span className="text-sm">{d("noExams")}</span>
      )}
    </WidgetFrame>
  );
}
