"use client"

import { getLmsEngagementMasteryQuery } from "@ihsp/api"
import { QueryState } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { PageContainer } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { StepikScope } from "../../shared/components/stepik-scope"
import { hrefs } from "../../shared/utils/hrefs"
import { MasteryMap } from "./mastery-map"

/** `/mastery/?course=`: the learner's mastery of each section and which sections are unlocked. */
export function MasteryPage({ courseId }: { courseId: string }) {
  const t = useT("engagement")
  const mastery = useQuery(getLmsEngagementMasteryQuery(courseId))
  return (
    <StepikScope>
      <PageContainer title={t("mastery.title")}>
        <QueryState query={mastery} isEmpty={(data) => data.sections.length === 0} emptyText={t("mastery.empty")}>
          {(data) => (
            <MasteryMap
              mastery={data}
              stepHref={(stepId) => hrefs.step(courseId, stepId)}
              className="mx-auto w-full max-w-3xl"
            />
          )}
        </QueryState>
      </PageContainer>
    </StepikScope>
  )
}
