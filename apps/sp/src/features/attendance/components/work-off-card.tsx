"use client"

import { getMeWorkOffsQuery, type MyWorkOff } from "@ihsp/api"
import { todayIso, useFormatters, useT } from "@ihsp/i18n"
import { Badge } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { QueryState } from "../../shared/components/query-state"

/** The student's open work-off tasks for missed lessons (WO-6). Hidden when there is nothing to work off. */
export function WorkOffCard() {
  const query = useQuery(getMeWorkOffsQuery({ status: "open" }))
  if (query.data?.length === 0) return null

  return (
    <QueryState query={query} rows={2}>
      {(items) => <WorkOffList items={items} />}
    </QueryState>
  )
}

function WorkOffList({ items }: { items: MyWorkOff[] }) {
  const t = useT("attendance.workOffs")
  const today = todayIso()

  return (
    <section aria-labelledby="work-offs-title" className="flex flex-col gap-3">
      <h2 id="work-offs-title" className="text-base font-semibold">
        {t("title")}
      </h2>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <WorkOffItem key={item.id} item={item} overdue={item.due_date !== null && item.due_date < today} />
        ))}
      </ul>
    </section>
  )
}

function WorkOffItem({ item, overdue }: { item: MyWorkOff; overdue: boolean }) {
  const t = useT("attendance.workOffs")
  const f = useFormatters()

  return (
    <li className="flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-muted-foreground text-xs tabular-nums">
          {f.date(item.date, { weekday: "short", day: "numeric", month: "short" })}
        </span>
        <span className="text-muted-foreground text-xs">{t("period", { period: item.period })}</span>
        <span className="min-w-0 flex-1 text-sm font-medium">{item.subject_name}</span>
        <Badge variant="outline">{t("status.assigned")}</Badge>
        {overdue ? <Badge variant="destructive">{t("overdue")}</Badge> : null}
      </div>
      {item.teacher_name ? <p className="text-muted-foreground text-xs">{item.teacher_name}</p> : null}
      <p className="text-sm whitespace-pre-line">{item.text}</p>
      {item.due_date ? (
        <p className={overdue ? "text-destructive text-xs font-medium" : "text-muted-foreground text-xs"}>
          {t("dueOn", { date: f.date(item.due_date, { day: "numeric", month: "short", year: "numeric" }) })}
        </p>
      ) : null}
    </li>
  )
}
