"use client"

import { getStaffTemporaryMarksPendingQuery, type TemporaryMark } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { MarkBadge, PageContainer } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { lessonHref } from "../../shared/utils/lesson-time"
import { QueryState } from "../../shared/components/query-state"

type Group = {
  lessonId: string
  date: string
  period: number
  groupName: string
  subjectName: string
  items: TemporaryMark[]
}

function groupByLesson(items: TemporaryMark[]): Group[] {
  const groups = new Map<string, Group>()
  for (const item of items) {
    const group = groups.get(item.lesson_id) ?? {
      lessonId: item.lesson_id,
      date: item.lesson_date,
      period: item.lesson_period,
      groupName: item.group_name,
      subjectName: item.subject_name,
      items: [],
    }
    group.items.push(item)
    groups.set(item.lesson_id, group)
  }
  return [...groups.values()].toSorted((a, b) => a.date.localeCompare(b.date) || a.period - b.period)
}

/** Temporary marks not yet put into EMIS, grouped by lesson (oldest first). */
export function TemporaryMarksPage() {
  const t = useT("temporaryMarks")
  const f = useFormatters()
  const query = useQuery(getStaffTemporaryMarksPendingQuery())
  return (
    <PageContainer title={t("pendingTitle")}>
      <QueryState query={query} rows={4} isEmpty={(data) => data.items.length === 0} emptyText={t("empty")}>
        {(data) => (
          <div className="flex flex-col gap-4">
            {groupByLesson(data.items).map((group) => (
              <section key={group.lessonId} className="rounded-lg border">
                <h2 className="border-b p-3 text-base font-semibold">
                  <Link href={lessonHref(group.lessonId)} className="hover:underline">
                    {f.date(group.date)} · {t("period", { number: group.period })} · {group.groupName} ·{" "}
                    {group.subjectName}
                  </Link>
                </h2>
                <ul className="divide-y">
                  {group.items.map((item) => (
                    <li key={item.id} className="flex items-center gap-3 p-3">
                      <MarkBadge mark={item.value} />
                      <span className="font-medium">{item.student_name}</span>
                      {item.comment ? <span className="text-muted-foreground text-sm">{item.comment}</span> : null}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </QueryState>
    </PageContainer>
  )
}
