"use client"

import { useT } from "@ihsp/i18n"
import { LinkButton } from "../../shared/components/link-button"
import { useTentativeExams } from "../../exams/hooks/use-tentative-exams"
import { TodayCard } from "./today-card"

/**
 * "3 exam dates to confirm": EMIS lessons and head students suggested control dates nobody confirmed yet. Links to
 * the group of the newest suggestion on the exams page; hidden while there is nothing to confirm.
 */
export function ExamSuggestionsCard() {
  const t = useT("today.examSuggestions")
  const { items } = useTentativeExams()
  const newest = items[0]
  if (!newest) return null
  const groupId = newest.audience[0]?.group_id
  const href = groupId ? `/group/exams/?group=${encodeURIComponent(groupId)}` : "/group/exams/"

  return (
    <TodayCard title={t("title")} action={<LinkButton href={href}>{t("review")}</LinkButton>}>
      <p className="text-sm font-medium">{t("summary", { count: items.length })}</p>
    </TodayCard>
  )
}
