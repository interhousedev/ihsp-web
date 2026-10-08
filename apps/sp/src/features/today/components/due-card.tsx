"use client"

import type { StudentToday } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import Link from "next/link"
import { HomeworkItemCard } from "../../homework/components/homework-item-card"
import { TodayCard } from "./today-card"

/**
 * Homework to do: overdue items first, then those due by the next study day, with tick boxes that work right there
 * and the count of what is still open (WEB-3, UF-WEB-02).
 */
export function DueCard({ today }: { today: StudentToday }) {
  const t = useT("today.due")
  const f = useFormatters()
  const open = today.due.filter((item) => item.done_at === null)
  const overdue = open.filter((item) => item.days_overdue > 0).length
  return (
    <TodayCard
      title={
        today.next_study_day
          ? t("titleOn", { date: f.date(today.next_study_day, { weekday: "short", day: "numeric", month: "short" }) })
          : t("title")
      }
      action={
        <Link
          href="/homework/"
          className="text-primary flex min-h-11 items-center text-sm underline-offset-4 hover:underline"
        >
          {t("all")}
        </Link>
      }
    >
      <p className="text-muted-foreground text-sm" data-testid="due-count">
        {t("count", { count: open.length })}
        {overdue > 0 ? (
          <>
            {" · "}
            <span className="text-destructive font-medium">{t("overdueCount", { count: overdue })}</span>
          </>
        ) : null}
      </p>
      <ul className="flex flex-col gap-2">
        {today.due.map((item) => (
          <HomeworkItemCard key={item.lesson_id} item={item} withNote={false} />
        ))}
      </ul>
    </TodayCard>
  )
}
