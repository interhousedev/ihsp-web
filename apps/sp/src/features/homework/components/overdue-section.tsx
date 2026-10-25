"use client"

import { useT } from "@ihsp/i18n"
import { Badge } from "@ihsp/ui"
import { useId } from "react"
import { QueryState } from "../../shared/components/query-state"
import { useHomeworkList } from "../hooks/use-homework"
import { HomeworkItemCard } from "./homework-item-card"

/**
 * The Overdue group (WEB-18): open homework past its due date, most overdue first. It sits above the tabs and is
 * highlighted, so nothing the teacher set is lost. It is left out while nothing is overdue.
 */
export function OverdueSection() {
  const t = useT("homework")
  const titleId = useId()
  const query = useHomeworkList("overdue")
  if (query.data?.length === 0 || (query.data === undefined && query.isPending)) return null

  return (
    <section
      aria-labelledby={titleId}
      data-testid="homework-overdue"
      className="border-destructive/40 bg-destructive/5 flex flex-col gap-2 rounded-xl border p-3"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2 id={titleId} className="text-destructive text-base font-semibold">
          {t("overdue.title")}
        </h2>
        {query.data ? <Badge variant="destructive">{query.data.length}</Badge> : null}
      </div>
      <QueryState query={query}>
        {(items) => (
          <ul className="flex flex-col gap-2">
            {items.map((item) => (
              <HomeworkItemCard key={item.lesson_id} item={item} />
            ))}
          </ul>
        )}
      </QueryState>
    </section>
  )
}
