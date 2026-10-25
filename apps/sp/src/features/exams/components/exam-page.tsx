"use client"

import type { AssessmentItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { PageContainer, StateView } from "@ihsp/ui"
import { parseAsString, useQueryState } from "nuqs"
import { plannerHref } from "../../grades/planner/utils/hrefs"
import { BackLink } from "../../shared/components/back-link"
import { LinkButton } from "../../shared/components/link-button"
import { QueryState } from "../../shared/components/query-state"
import { useExamLabels } from "../hooks/use-exam-labels"
import { useExams } from "../hooks/use-exams"
import { findExam } from "../utils/exam-list"
import { EXAMS_HREF, PRACTICE_QUIZ_HREF } from "../utils/hrefs"
import { ExamDecks } from "./exam-decks"
import { ExamMaterials } from "./exam-materials"
import { ExamSummary } from "./exam-summary"

function ExamContent({
  item,
  exams,
  practiceQuizHref,
}: {
  item: AssessmentItem
  exams: AssessmentItem[]
  practiceQuizHref: string
}) {
  const view = useT("exams.view")
  return (
    <div className="flex flex-col gap-6">
      <ExamSummary item={item} />
      <div className="flex flex-wrap gap-2">
        <LinkButton href={practiceQuizHref} variant="default">
          {view("practice")}
        </LinkButton>
        {item.kind === "other" ? null : <LinkButton href={plannerHref(item.subject.id)}>{view("planner")}</LinkButton>}
      </div>
      <ExamDecks subject={item.subject} />
      <ExamMaterials item={item} exams={exams} />
    </div>
  )
}

/**
 * The preparation page of one control (ACA-14): `?id=`. The id is looked up in the same list as the exams page,
 * because there is no get-by-id endpoint.
 *
 * `practiceQuizHref` is where "Practice quiz" goes; it defaults to `PRACTICE_QUIZ_HREF` (the notebooks page).
 */
export function ExamPage({ practiceQuizHref = PRACTICE_QUIZ_HREF }: { practiceQuizHref?: string }) {
  const t = useT("exams")
  const labels = useExamLabels()
  const [id] = useQueryState("id", parseAsString)
  const query = useExams()
  const item = query.data ? findExam(query.data.items, id) : null
  return (
    <PageContainer title={item ? labels.name(item) : t("title")}>
      <BackLink href={EXAMS_HREF} label={t("view.back")} />
      <QueryState query={query} rows={5}>
        {(data) =>
          item ? (
            <ExamContent item={item} exams={data.items} practiceQuizHref={practiceQuizHref} />
          ) : (
            <StateView state="empty" emptyText={t("view.notFound")} />
          )
        }
      </QueryState>
    </PageContainer>
  )
}
