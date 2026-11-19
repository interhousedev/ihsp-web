"use client"

import { useT } from "@ihsp/i18n"
import { Badge, Tabs, TabsContent, TabsList, TabsTrigger } from "@ihsp/ui"
import type { UniReviewEntry } from "./api"

/** One tab per university: alignment, what to emphasise (goals) and specific edits (tips). */
export function UniversityTabs({ entries }: { entries: UniReviewEntry[] }) {
  const t = useT("essayReview")
  const first = entries[0]
  if (!first) return null
  return (
    <Tabs defaultValue={first.institution_id} data-testid="uni-reviews">
      <TabsList className="max-w-full overflow-x-auto">
        {entries.map((entry) => (
          <TabsTrigger key={entry.institution_id} value={entry.institution_id}>
            {entry.name}
          </TabsTrigger>
        ))}
      </TabsList>
      {entries.map(({ institution_id, review, stale }) => (
        <TabsContent key={institution_id} value={institution_id} className="flex flex-col gap-3 text-sm">
          <p className="flex flex-wrap items-center gap-2 font-medium">
            {t("uni.alignment", { score: review.alignment })}
            {stale ? <Badge variant="outline">{t("stale")}</Badge> : null}
          </p>
          <p>{review.fit_summary}</p>
          {review.goals.length > 0 ? (
            <div>
              <h4 className="font-medium">{t("uni.emphasise")}</h4>
              <ul className="list-disc pl-5">
                {review.goals.map((goal) => (
                  <li key={goal.key}>
                    {goal.goal} ({t(`uni.level.${goal.alignment}`)}){goal.suggestion ? `: ${goal.suggestion}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {review.supplement_tips.length > 0 ? (
            <div>
              <h4 className="font-medium">{t("uni.edits")}</h4>
              <ul className="list-disc pl-5">
                {review.supplement_tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {review.risks.length > 0 ? (
            <div>
              <h4 className="font-medium">{t("uni.risks")}</h4>
              <ul className="list-disc pl-5">
                {review.risks.map((risk) => (
                  <li key={risk}>{risk}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </TabsContent>
      ))}
    </Tabs>
  )
}
