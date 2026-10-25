import type { CurriculumView, SubjectCard } from "@ihsp/api"
import { curriculumSemester, findCurriculumSubject } from "@ihsp/features-core"

/**
 * The curriculum subject of a card in the semester shown on the page (the current one of the curriculum when none is
 * chosen): by the academic subject id, else by the EMIS subject id when the card carries one.
 */
export function curriculumSubjectOf(
  card: SubjectCard,
  curriculum: CurriculumView | null | undefined,
  semester: number | undefined,
) {
  if (!curriculum) return null
  const emisSubjectId =
    "emis_subject_id" in card && typeof card.emis_subject_id === "number" ? card.emis_subject_id : null
  return findCurriculumSubject(curriculum, curriculumSemester(curriculum, semester), {
    subjectId: card.subject.id,
    emisSubjectId,
  })
}
