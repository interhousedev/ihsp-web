import type { CurriculumView } from "@ihsp/api"

export type SemesterSubject = {
  subjectId: string
  name: CurriculumView["semesters"][number]["subjects"][number]["name"]
  hours: number | null
}

export type SemesterSection = {
  number: number
  /** The current semester is open at first; the others are reached by opening them. */
  open: boolean
  subjects: SemesterSubject[]
}

/**
 * The curriculum as semester accordions, oldest first. Each section holds only the subjects of its own semester; a
 * semester without a curriculum has nothing to show, so no sections come back at all.
 */
export function semesterSections(
  curriculum: CurriculumView | null | undefined,
  currentSemester: number | null,
): SemesterSection[] {
  if (!curriculum) return []
  const current = currentSemester ?? curriculum.current_semester
  return curriculum.semesters
    .toSorted((a, b) => a.number - b.number)
    .map((semester) => ({
      number: semester.number,
      open: semester.number === current,
      subjects: semester.subjects.map((subject) => ({
        subjectId: subject.subject_id ?? subject.emis_subject_id.toString(),
        name: subject.name,
        hours: subject.study_hours,
      })),
    }))
}
