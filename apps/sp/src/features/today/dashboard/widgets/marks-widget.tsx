"use client"

import { useT } from "@ihsp/i18n"
import { useToday } from "../../hooks/use-today"
import type { Widget } from "../model"
import { WidgetFrame } from "../widget-frame"
import { BigNumber, Lines, listRows } from "./shared"

export function MarksWidget({ widget, editing }: { widget: Widget; editing?: boolean }) {
  const t = useT("today.dashboard")
  const today = useToday().data
  const marks = today?.new_marks ?? []
  const gpa = today?.semester.gpa
  return (
    <WidgetFrame widget={widget} editing={editing} title={t("kinds.marks")} href="/grades/">
      <BigNumber value={gpa === null || gpa === undefined ? "–" : gpa.toFixed(2)} label={t("gpa")} />
      {widget.size !== "1x1" ? (
        <Lines items={marks.slice(0, listRows(widget)).map((mark) => `${mark.subject.name}: ${mark.value}`)} />
      ) : null}
    </WidgetFrame>
  )
}
