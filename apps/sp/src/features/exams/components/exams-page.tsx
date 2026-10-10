"use client"

import type { AssessmentItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { PageContainer } from "@ihsp/ui"
import { parseAsString, useQueryState } from "nuqs"
import { QueryState } from "../../shared/components/query-state"
import { useExams, useIsHeadStudent } from "../hooks/use-exams"
import { filterBySubject, splitExams, subjectsOf } from "../utils/exam-list"
import { ExamSection } from "./exam-section"
import { SubjectFilter } from "./subject-filter"
import { SuggestExamDialog } from "./suggest-exam-dialog"

function ExamsContent({ items }: { items: AssessmentItem[] }) {
  const t = useT("exams")
  const [subjectId, setSubjectId] = useQueryState("subject", parseAsString)
  // A filter left in the address for a subject that has no controls any more would show an empty page.
  const subjects = subjectsOf(items)
  const selected = subjects.some((subject) => subject.id === subjectId) ? subjectId : null
  const { upcoming, past } = splitExams(filterBySubject(items, selected))
  return (
    <div className="flex flex-col gap-6">
      <SubjectFilter subjects={subjects} value={selected} onChange={(next) => void setSubjectId(next)} />
      <ExamSection title={t("upcoming")} items={upcoming} emptyText={t("noUpcoming")} />
      <ExamSection title={t("past")} items={past} emptyText={t("noPast")} />
    </div>
  )
}

/**
 * Exams (ACA-14): the student's midterm and final controls in "Upcoming" and "Past", with badges for dates nobody
 * confirmed and for control weeks without a date. A head student can suggest a date.
 */
export function ExamsPage() {
  const t = useT("exams")
  const query = useExams()
  const isHeadStudent = useIsHeadStudent()
  return (
    <PageContainer title={t("title")} actions={isHeadStudent ? <SuggestExamDialog /> : undefined}>
      <QueryState query={query} rows={4} isEmpty={(data) => data.items.length === 0} emptyText={t("empty")}>
        {(data) => <ExamsContent items={data.items} />}
      </QueryState>
    </PageContainer>
  )
}
