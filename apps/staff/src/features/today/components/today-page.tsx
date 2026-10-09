"use client"

import { getStaffTodayQuery } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { PageContainer } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { QueryState } from "../../shared/components/query-state"
import { useNow } from "../../shared/hooks/use-now"
import { ExamSuggestionsCard } from "./exam-suggestions-card"
import { GetStartedCard } from "./get-started-card"
import { NeedsAttentionCard } from "./needs-attention-card"
import { NowNextCard } from "./now-next-card"
import { TodayLessonsCard } from "./today-lessons-card"

/** Today (STF-2, UF-STF-01, UF-STF-02): what to do now, the day's lessons and what was missed. */
export function TodayPage() {
  const t = useT("today")
  const f = useFormatters()
  const now = useNow(60_000)
  const query = useQuery(getStaffTodayQuery())

  return (
    <PageContainer title={t("title")} description={f.date(now, { weekday: "long", day: "numeric", month: "long" })}>
      <GetStartedCard />
      <ExamSuggestionsCard />
      <QueryState query={query} rows={4}>
        {(today) => (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <NowNextCard lesson={today.now_or_next} />
            <NeedsAttentionCard lessons={today.needs_attention} />
            <TodayLessonsCard lessons={today.lessons} />
          </div>
        )}
      </QueryState>
    </PageContainer>
  )
}
