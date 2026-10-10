"use client"

import { useT } from "@ihsp/i18n"
import { useToday } from "../../hooks/use-today"
import type { Widget } from "../model"
import { WidgetFrame } from "../widget-frame"
import { BigNumber, Lines, listRows } from "./shared"

export function HomeworkWidget({ widget, editing }: { widget: Widget; editing?: boolean }) {
  const t = useT("today.dashboard")
  const due = useToday().data?.due ?? []
  return (
    <WidgetFrame widget={widget} editing={editing} title={t("kinds.homework")} href="/homework/">
      <BigNumber value={due.length} label={t("homeworkDue")} />
      {widget.size !== "1x1" ? <Lines items={due.slice(0, listRows(widget)).map((item) => item.subject.name)} /> : null}
    </WidgetFrame>
  )
}
