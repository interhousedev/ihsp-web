"use client"

import { useT } from "@ihsp/i18n"
import { Button } from "@ihsp/ui"
import { LinkButton } from "../../shared/components/link-button"
import { useTentativeExams } from "../../exams/hooks/use-tentative-exams"
import { TodayCard } from "./today-card"

/**
 * "3 exam dates to confirm": EMIS lessons and head students suggested control dates nobody confirmed yet. Links to
 * the group of the newest suggestion on the exams page; hidden while there is nothing to confirm. A failed load says
 * so and offers a retry instead of disappearing.
 */
export function ExamSuggestionsCard() {
  const t = useT("today.examSuggestions")
  const tc = useT("common")
  const { items, isPending, isError, refetch } = useTentativeExams()
  if (isError) {
    return (
      <TodayCard
        title={t("title")}
        action={
          <Button variant="outline" className="min-h-11 md:min-h-8" onClick={() => void refetch()}>
            {tc("retry")}
          </Button>
        }
      >
        <p role="alert" className="text-destructive text-sm">
          {t("error")}
        </p>
      </TodayCard>
    )
  }
  const newest = items[0]
  if (isPending || !newest) return null
  const groupId = newest.audience[0]?.group_id
  const href = groupId ? `/group/exams/?group=${encodeURIComponent(groupId)}` : "/group/exams/"

  return (
    <TodayCard title={t("title")} action={<LinkButton href={href}>{t("review")}</LinkButton>}>
      <p className="text-sm font-medium">{t("summary", { count: items.length })}</p>
    </TodayCard>
  )
}
