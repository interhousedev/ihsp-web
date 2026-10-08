"use client"

import type { StudentToday } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import Link from "next/link"
import { HomeworkItemCard } from "../../homework/components/homework-item-card"
import { TodayCard } from "./today-card"

/** Homework due on the next study day, with tick boxes that work right there (WEB-3, UF-WEB-02). */
export function DueCard({ today }: { today: StudentToday }) {
  const t = useT("today.due")
  const f = useFormatters()
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
      <ul className="flex flex-col gap-2">
        {today.due.map((item) => (
          <HomeworkItemCard key={item.lesson_id} item={item} withNote={false} />
        ))}
      </ul>
    </TodayCard>
  )
}
