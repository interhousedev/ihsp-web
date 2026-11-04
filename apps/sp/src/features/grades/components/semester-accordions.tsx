"use client"

import { getMeSubjectsQuery, type CurriculumView, type SubjectCard } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { MarkBadge } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useState, type SyntheticEvent } from "react"
import { useCurriculum } from "../../subjects/hooks/use-curriculum"
import { semesterSections, type SemesterSection } from "../utils/semester-sections"

/**
 * The study plan and the marks by semester, as accordions. The current semester is open; the others open on demand, and
 * a semester loads its subjects only once it is opened. Each section lists only the subjects of its own semester.
 */
export function SemesterAccordions({ current }: { current: number | null }) {
  const t = useT("grades.sections")
  const curriculum = useCurriculum().data
  const sections = semesterSections(curriculum, current)
  if (sections.length === 0) return null
  return (
    <section aria-labelledby="semester-sections-title" className="flex flex-col gap-2">
      <h2 id="semester-sections-title" className="text-base font-semibold">
        {t("title")}
      </h2>
      {sections.map((section) => (
        <SemesterDetails key={section.number} section={section} curriculum={curriculum} />
      ))}
    </section>
  )
}

function SemesterDetails({
  section,
  curriculum,
}: {
  section: SemesterSection
  curriculum: CurriculumView | null | undefined
}) {
  const t = useT("grades.sections")
  const [opened, setOpened] = useState(section.open)
  const subjects = useQuery({ ...getMeSubjectsQuery({ semester: section.number }), enabled: opened }).data
  const hoursOf = (subjectId: string) =>
    section.subjects.find((subject) => subject.subjectId === subjectId)?.hours ?? null

  return (
    <details
      open={section.open}
      onToggle={(event: SyntheticEvent<HTMLDetailsElement>) => {
        if (event.currentTarget.open) setOpened(true)
      }}
      className="rounded-card border"
    >
      <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-2 px-3 py-2 font-medium">
        {t("semester", { number: section.number })}
        {section.number === curriculum?.current_semester ? (
          <span className="text-muted-foreground text-xs">{t("current")}</span>
        ) : null}
      </summary>
      {opened ? (
        <ul className="flex flex-col gap-1 px-3 pb-3 text-sm">
          {(subjects ?? []).map((card: SubjectCard) => (
            <li key={card.subject.id} className="flex items-center justify-between gap-3">
              <span>{card.subject.name}</span>
              <span className="text-muted-foreground flex items-center gap-2">
                {hoursOf(card.subject.id) !== null ? t("hours", { hours: hoursOf(card.subject.id) ?? 0 }) : null}
                <MarkBadge mark={card.semester_mark} size="sm" />
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </details>
  )
}
