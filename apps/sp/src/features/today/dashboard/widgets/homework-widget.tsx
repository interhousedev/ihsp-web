"use client"

import { useT } from "@ihsp/i18n"
import { useOpenWorkOffs } from "../../../homework/hooks/use-homework"
import { useToday } from "../../hooks/use-today"
import type { Widget } from "../model"
import { WidgetFrame } from "../widget-frame"
import { BigNumber, Lines, listRows } from "./shared"

export function HomeworkWidget({ widget, editing }: { widget: Widget; editing?: boolean }) {
  const t = useT("today.dashboard")
  const due = useToday().data?.due ?? []
  const workOffs = useOpenWorkOffs().data ?? []
  return (
    <WidgetFrame widget={widget} editing={editing} title={t("kinds.homework")} href="/homework/">
      <BigNumber value={due.length + workOffs.length} label={t("homeworkDue")} />
      {widget.size !== "1x1" ? <Lines items={due.slice(0, listRows(widget)).map((item) => item.subject.name)} /> : null}
    </WidgetFrame>
  )
}
