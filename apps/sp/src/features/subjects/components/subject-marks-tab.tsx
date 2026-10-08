"use client"

import type { MarkItem, SubjectDetail } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { MarkBadge, StateView, ToggleGroup, ToggleGroupItem } from "@ihsp/ui"
import Link from "next/link"
import { useState } from "react"

type TypeFilter = "all" | MarkItem["type"]
const FILTERS: readonly TypeFilter[] = ["all", "lesson", "midterm", "final"]

/** All marks of the subject with date and type, filterable by type (WEB-13). */
export function SubjectMarksTab({ detail }: { detail: SubjectDetail }) {
  const t = useT("subjects.marks")
  const f = useFormatters()
  const [filter, setFilter] = useState<TypeFilter>("all")
  const marks = detail.marks
    .filter((mark) => filter === "all" || mark.type === filter)
    .toSorted((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="flex flex-col gap-3">
      <ToggleGroup
        value={[filter]}
        onValueChange={(values) => {
          const next = values[0]
          if (next && FILTERS.includes(next as TypeFilter)) setFilter(next as TypeFilter)
        }}
        variant="outline"
        aria-label={t("filter")}
        className="flex-wrap"
      >
        {FILTERS.map((value) => (
          <ToggleGroupItem key={value} value={value} className="min-h-11 px-3 md:min-h-8">
            {t(`type.${value}`)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {marks.length === 0 ? (
        <StateView state="empty" emptyText={t("empty")} />
      ) : (
        <ul className="flex flex-col gap-2">
          {marks.map((mark, index) => (
            <li
              key={`${mark.date}-${mark.type}-${index}`}
              className="flex min-h-11 items-center gap-3 rounded-lg border p-2"
            >
              <MarkBadge mark={mark.value} size="lg" />
              <span className="min-w-0 flex-1 text-sm">
                <span className="font-medium">{t(`type.${mark.type}`)}</span>
                <span className="text-muted-foreground block text-xs">
                  {f.date(mark.date, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                </span>
              </span>
              {mark.lesson_id ? (
                <Link
                  href={`/lessons/view/?id=${encodeURIComponent(mark.lesson_id)}`}
                  className="text-primary flex min-h-11 items-center text-sm underline-offset-4 hover:underline"
                >
                  {t("lesson")}
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
