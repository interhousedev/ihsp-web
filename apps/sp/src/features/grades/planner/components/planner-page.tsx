"use client"

import { useT } from "@ihsp/i18n"
import { PageContainer, StateView } from "@ihsp/ui"
import { parseAsInteger, parseAsString, useQueryState } from "nuqs"
import { BackLink } from "../../../shared/components/back-link"
import { gradesHref } from "../utils/hrefs"
import { PlannerBody } from "./planner-body"

/**
 * The mark planner (ACA-15): `/grades/plan/?subject=<id>` and, for another semester, `&semester=<n>`. It shows what
 * the marks so far give, what the remaining controls would bring and what each grade needs; the formula is the
 * backend's, the page only shows the answer. A page without a subject sends the student back to the grades.
 */
export function PlannerPage() {
  const t = useT("planner")
  const [subjectId] = useQueryState("subject", parseAsString)
  const [semester] = useQueryState("semester", parseAsInteger)
  if (!subjectId) {
    return (
      <PageContainer title={t("title")}>
        <BackLink href={gradesHref()} label={t("back")} />
        <StateView state="empty" emptyText={t("noSubject")} />
      </PageContainer>
    )
  }
  // A new subject or semester starts with no tried-out marks.
  return <PlannerBody key={`${subjectId}:${semester ?? ""}`} subjectId={subjectId} semester={semester} />
}
