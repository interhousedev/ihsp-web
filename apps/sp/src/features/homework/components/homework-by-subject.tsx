"use client"

import { getMeHomeworkQuery, type HomeworkItem } from "@ihsp/api"
import { todayIso, useFormatters, useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { QueryState } from "../../shared/components/query-state"
import { groupBySubject, shiftDay } from "../utils/subject-groups"
import { HomeworkItemCard } from "./homework-item-card"

/**
 * Homework due on one day, grouped by subject. One date switcher sits above the groups; a subject without homework on
 * that day is not shown, and a day without any homework shows one empty-state text.
 */
export function HomeworkBySubject() {
  const t = useT("homework.bySubject")
  const f = useFormatters()
  const [day, setDay] = useState(() => todayIso())
  const query = useQuery(getMeHomeworkQuery({ from: day, to: day }))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 md:size-8"
          aria-label={t("previousDay")}
          onClick={() => setDay(shiftDay(day, -1))}
        >
          <Icons.chevronLeft aria-hidden />
        </Button>
        <p className="text-sm font-medium" aria-live="polite">
          {f.date(day, { weekday: "short", day: "numeric", month: "short" })}
        </p>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 md:size-8"
          aria-label={t("nextDay")}
          onClick={() => setDay(shiftDay(day, 1))}
        >
          <Icons.chevronRight aria-hidden />
        </Button>
      </div>
      <QueryState query={query} isEmpty={(items: HomeworkItem[]) => items.length === 0} emptyText={t("empty")}>
        {(items) => (
          <div className="flex flex-col gap-5">
            {groupBySubject(items).map((group) => (
              <section
                key={group.subject.id}
                className="flex flex-col gap-2"
                aria-labelledby={`subject-${group.subject.id}`}
              >
                <h3 id={`subject-${group.subject.id}`} className="text-sm font-semibold">
                  {group.subject.name}
                </h3>
                <ul className="flex flex-col gap-2">
                  {group.items.map((item) => (
                    <HomeworkItemCard key={item.lesson_id} item={item} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </QueryState>
    </div>
  )
}
