"use client"

import { useT } from "@ihsp/i18n"
import { useOpenWorkOffs } from "../../../homework/hooks/use-homework"
import { useToday } from "../../hooks/use-today"
import type { Widget } from "../model"
import { CardEmpty, WidgetFrame } from "../widget-frame"
import { HomeworkWeekRow } from "./homework-week-row"
import { BigNumber, Lines, listRows } from "./shared"

export function HomeworkWidget({ widget, editing }: { widget: Widget; editing?: boolean }) {
  const t = useT("today.dashboard")
  const today = useToday()
  const workOffs = useOpenWorkOffs().data ?? []
  const due = today.data?.due ?? []
  const total = due.length + workOffs.length
  return (
    <WidgetFrame
      widget={widget}
      editing={editing}
      title={t("kinds.homework")}
      href="/homework/"
      status={today.isPending ? "loading" : today.isError ? "error" : undefined}
      onRetry={() => void today.refetch()}
    >
      {total === 0 ? (
        <CardEmpty text={t("noHomework")} />
      ) : (
        <>
          <BigNumber value={total} label={t("homeworkDue")} />
          {widget.size !== "1x1" ? (
            <>
              <HomeworkWeekRow />
              <Lines items={due.slice(0, listRows(widget)).map((item) => item.subject.name)} />
            </>
          ) : null}
        </>
      )}
    </WidgetFrame>
  )
}
