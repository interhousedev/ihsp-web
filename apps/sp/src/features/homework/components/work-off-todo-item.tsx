"use client"

import type { MyWorkOff } from "@ihsp/api"
import { todayIso, useFormatters, useT } from "@ihsp/i18n"
import { Badge, cn } from "@ihsp/ui"
import Link from "next/link"

/**
 * One open work-off task in the to-do list (WO-6): labelled as a work-off, with subject, the lesson date, the task text
 * and the due date (overdue styled). The whole item opens the lesson it was given for.
 */
export function WorkOffTodoItem({ item }: { item: MyWorkOff }) {
  const t = useT("homework.workOff")
  const f = useFormatters()
  const overdue = item.due_date !== null && item.due_date < todayIso()
  const dayFormat = { weekday: "short", day: "numeric", month: "short" } as const

  return (
    <li
      className={cn("bg-card rounded-lg border", overdue && "border-destructive/50 bg-destructive/5")}
      data-testid="work-off-item"
      data-overdue={overdue}
    >
      <Link
        href={`/lessons/view/?id=${encodeURIComponent(item.lesson_id)}`}
        className="flex min-h-11 flex-col gap-1 rounded-lg p-3"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{t("badge")}</Badge>
          <span className="text-sm font-semibold">{item.subject_name}</span>
          {overdue ? <Badge variant="destructive">{t("overdue")}</Badge> : null}
        </div>
        <p className="text-sm break-words whitespace-pre-line">{item.text}</p>
        <p className="text-muted-foreground text-xs">
          {[
            t("lesson", { date: f.date(item.date, dayFormat) }),
            item.due_date ? t("dueOn", { date: f.date(item.due_date, dayFormat) }) : t("noDueDate"),
          ].join(" · ")}
        </p>
      </Link>
    </li>
  )
}
