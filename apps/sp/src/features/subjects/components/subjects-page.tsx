"use client"

import { useT } from "@ihsp/i18n"
import { PageContainer, SemesterSwitcher } from "@ihsp/ui"
import { parseAsInteger, useQueryState } from "nuqs"
import { QueryState } from "../../shared/components/query-state"
import { useCurrentSemester, useSubjects } from "../hooks/use-subjects"
import { SubjectCard } from "./subject-card"

/** Subjects of the semester, switchable to past ones (WEB-7, UF-WEB-05). */
export function SubjectsPage() {
  const t = useT("subjects")
  const [semesterParam, setSemester] = useQueryState("semester", parseAsInteger)
  const current = useCurrentSemester()
  const semester = semesterParam ?? undefined
  const query = useSubjects(semester)
  const selected = semester ?? current ?? 1
  const available = Array.from({ length: Math.max(current ?? 1, selected) }, (_, index) => ({ value: index + 1 }))

  return (
    <PageContainer
      title={t("title")}
      actions={
        <SemesterSwitcher
          value={selected}
          onChange={(next) => void setSemester(next === current ? null : next)}
          semesters={available}
        />
      }
    >
      <QueryState query={query} isEmpty={(cards) => cards.length === 0} emptyText={t("empty")} rows={4}>
        {(cards) => (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => (
              <SubjectCard key={card.subject.id} card={card} semester={semester} />
            ))}
          </ul>
        )}
      </QueryState>
    </PageContainer>
  )
}
