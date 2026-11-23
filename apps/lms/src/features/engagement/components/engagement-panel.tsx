"use client"

import { getLmsEngagementQuestsQuery, getLmsEngagementSummaryQuery } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Card, CardContent, Skeleton } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { LinkButton } from "../../shared/components/link-button"
import { hrefs } from "../../shared/utils/hrefs"
import { tashkentToday } from "../utils/engagement"
import { LevelRing } from "./level-ring"
import { QuestCard } from "./quest-card"
import { StreakWeek } from "./streak-week"

/** `/my/` top: level, the school-week streak, today's review and the class quests. Hidden while the API is unavailable. */
export function EngagementPanel() {
  const t = useT("engagement")
  const summary = useQuery(getLmsEngagementSummaryQuery())
  const quests = useQuery(getLmsEngagementQuestsQuery())
  if (summary.isPending) return <Skeleton className="h-40 w-full rounded-xl" />
  if (summary.isError) return null
  const data = summary.data
  const active = (quests.data?.items ?? []).filter((quest) => !quest.done || quest.ends_on >= tashkentToday())
  return (
    <section aria-labelledby="my-progress" className="flex flex-col gap-3">
      <h2 id="my-progress" className="text-lg font-semibold">
        {t("panel.title")}
      </h2>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4">
            <LevelRing level={data.level} into={data.xp_into_level} forNext={data.xp_for_next} />
            <div className="flex flex-col gap-0.5">
              <p className="font-semibold">{t("level", { level: data.level })}</p>
              <p className="text-muted-foreground text-sm tabular-nums">{t("xp", { xp: data.xp_total })}</p>
              <p className="text-muted-foreground text-xs">
                {t("toNext", { xp: Math.max(0, data.xp_for_next - data.xp_into_level) })}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <StreakWeek streak={data.streak} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex h-full flex-col justify-between gap-3">
            <div>
              <p className="font-semibold">{t("panel.review")}</p>
              <p className="text-muted-foreground text-sm">
                {data.review_due > 0 ? t("panel.reviewDue", { count: data.review_due }) : t("panel.reviewNone")}
              </p>
            </div>
            {data.review_due > 0 ? (
              <LinkButton href={hrefs.review()} className="min-h-11 md:min-h-8">
                {t("panel.startReview")}
              </LinkButton>
            ) : null}
          </CardContent>
        </Card>
      </div>
      {active.length > 0 ? (
        <>
          <h3 className="text-base font-semibold">{t("panel.quests")}</h3>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((quest) => (
              <li key={quest.id} className="flex">
                <QuestCard quest={quest} today={tashkentToday()} className="w-full" />
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  )
}
