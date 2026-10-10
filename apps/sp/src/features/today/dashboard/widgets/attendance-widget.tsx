"use client";

import { useT } from "@ihsp/i18n";
import { useToday } from "../../hooks/use-today";
import type { Widget } from "../model";
import { WidgetFrame } from "../widget-frame";
import { BigNumber } from "./shared";

export function AttendanceWidget({
  widget,
  editing,
}: {
  widget: Widget;
  editing?: boolean;
}) {
  const t = useT("today.dashboard");
  const absences = useToday().data?.semester.absences;
  return (
    <WidgetFrame
      widget={widget}
      editing={editing}
      title={t("kinds.attendance")}
      href="/attendance/"
    >
      <BigNumber value={absences ?? "–"} label={t("absences")} />
    </WidgetFrame>
  );
}
