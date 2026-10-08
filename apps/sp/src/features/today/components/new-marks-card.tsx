"use client"

import type { MarkItem } from "@ihsp/api"
import { useUpdatePreferences } from "@ihsp/features-core"
import { useFormatters, useT } from "@ihsp/i18n"
import { MarkBadge } from "@ihsp/ui"
import Link from "next/link"
import { useEffect, useRef } from "react"
import { TodayCard } from "./today-card"

/**
 * Marks since the last visit (WEB-3). Once they are on screen the visit is recorded (`seen_marks_at`), so the next
 * visit starts from here.
 */
export function NewMarksCard({ marks }: { marks: MarkItem[] }) {
  const t = useT("today.marks")
  const f = useFormatters()
  const { mutate } = useUpdatePreferences()
  const recorded = useRef(false)

  useEffect(() => {
    if (recorded.current || marks.length === 0) return
    recorded.current = true
    // If this fails the marks simply show as new again on the next visit; there is nothing to tell the student.
    mutate({ seen_marks_at: new Date().toISOString() })
  }, [marks.length, mutate])

  return (
    <TodayCard title={t("title")}>
      <ul className="flex flex-col">
        {marks.map((mark, index) => (
          <li key={`${mark.subject.id}-${mark.date}-${mark.type}-${index}`}>
            <Link
              href={`/subjects/view/?id=${encodeURIComponent(mark.subject.id)}&tab=marks`}
              className="hover:bg-accent focus-visible:ring-ring flex min-h-11 items-center gap-3 rounded-lg px-2 outline-none focus-visible:ring-2"
            >
              <MarkBadge mark={mark.value} />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{mark.subject.name}</span>
              <span className="text-muted-foreground shrink-0 text-xs">
                {t(`type.${mark.type}`)} · {f.date(mark.date, { day: "numeric", month: "short" })}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </TodayCard>
  )
}
