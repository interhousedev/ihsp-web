"use client"

import type { AssessmentItem } from "@ihsp/api"
import { todayIso, useT } from "@ihsp/i18n"
import Link from "next/link"
import { useMemo } from "react"
import { ExamBadges } from "../../exams/components/exam-badges"
import { useExamLabels } from "../../exams/hooks/use-exam-labels"
import { useExamsAhead } from "../../exams/hooks/use-exams"
import { EXAMS_HREF, examHref } from "../../exams/utils/hrefs"
import { nextControls } from "../../exams/utils/next-controls"
import { useNow } from "../../shared/hooks/use-now"
import { TodayCard } from "./today-card"

/** Days ahead the card looks, and how many more controls it lists under the nearest one. */
const DAYS_AHEAD = 14
const LIST_LIMIT = 4

/**
 * Controls in the next 14 days (and a control week running now): the nearest one big, the rest in a short list,
 * unconfirmed ones marked (ACA-14). Hidden when there is nothing to show or the request failed: Today works without it.
 */
export function ExamCountdownCard() {
  const t = useT("exams.card")
  const labels = useExamLabels()
  const today = todayIso(useNow(60_000))
  const query = useExamsAhead(today, DAYS_AHEAD)
  const items = useMemo(() => nextControls(query.data?.items ?? []), [query.data])
  const [next, ...others] = items
  if (!next) return null

  const headline = (item: AssessmentItem) =>
    t("headline", { control: labels.control(item), subject: item.subject.name, when: labels.countdown(item) })

  return (
    <TodayCard
      title={t("title")}
      action={
        <Link
          href={EXAMS_HREF}
          className="text-primary flex min-h-11 items-center text-sm underline-offset-4 hover:underline"
        >
          {t("all")}
        </Link>
      }
    >
      <Link
        href={examHref(next.id)}
        className="focus-visible:ring-ring flex flex-col gap-1 rounded-lg outline-none focus-visible:ring-2"
      >
        <span className="text-xl font-semibold break-words" data-testid="exam-next">
          {headline(next)}
        </span>
        <span className="text-muted-foreground text-sm">{labels.when(next)}</span>
        <ExamBadges item={next} />
      </Link>
      {others.length > 0 ? (
        <ul className="flex flex-col">
          {others.slice(0, LIST_LIMIT).map((item) => (
            <li key={item.id} data-testid="exam-next-item">
              <Link
                href={examHref(item.id)}
                className="focus-visible:ring-ring flex min-h-11 flex-wrap items-center gap-x-2 gap-y-1 rounded-lg py-1 text-sm outline-none focus-visible:ring-2"
              >
                <span className="break-words">{headline(item)}</span>
                <ExamBadges item={item} />
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </TodayCard>
  )
}
