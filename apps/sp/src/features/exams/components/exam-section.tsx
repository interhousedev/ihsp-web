"use client"

import type { AssessmentItem } from "@ihsp/api"
import { useFormatters } from "@ihsp/i18n"
import { useId } from "react"
import { groupByMonth } from "../utils/exam-list"
import { ExamRow } from "./exam-row"

/** "Upcoming" or "Past": a titled section of controls grouped under their month. */
export function ExamSection({
  title,
  items,
  emptyText,
}: {
  title: string
  items: AssessmentItem[]
  emptyText: string
}) {
  const f = useFormatters()
  const titleId = useId()
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-3">
      <h2 id={titleId} className="text-lg font-semibold">
        {title}
      </h2>
      {items.length === 0 ? <p className="text-muted-foreground text-sm">{emptyText}</p> : null}
      {groupByMonth(items).map((group) => (
        <div key={group.month} className="flex flex-col gap-2">
          <h3 className="text-muted-foreground text-sm font-medium">
            {f.date(`${group.month}-01`, { month: "long", year: "numeric" })}
          </h3>
          <ul className="flex flex-col gap-2">
            {group.items.map((item) => (
              <ExamRow key={item.id} item={item} />
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}
