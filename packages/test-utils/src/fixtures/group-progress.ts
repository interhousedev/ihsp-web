import type { GroupProgress, GroupProgressCell } from "@ihsp/api"
import { ids, subjectRefs } from "./world"

const cell = (subject_id: string, patch: Partial<GroupProgressCell> = {}): GroupProgressCell => ({
  subject_id,
  semester_mark: 5,
  midterm_avg: 4.5,
  final_avg: 5,
  lesson_avg: 4.8,
  emis_rating: null,
  marks_count: 6,
  absences: 1,
  lessons: 20,
  absence_rate: 0.05,
  ...patch,
})

/** A group's marks and attendance for the given semester (semester 2 has a thinner table). */
export function groupProgressFor(semester: number): GroupProgress {
  return {
    group_id: ids.group1TN1,
    group_name: "1TN1",
    semester,
    semesters: [1, 2],
    subjects: [subjectRefs.math, subjectRefs.physics],
    students: [
      {
        student: { id: ids.student, first_name: "Aziza", last_name: "Karimova" },
        gpa: semester === 1 ? 4.5 : 3.9,
        absences: 3,
        lessons: 40,
        absence_rate: 0.075,
        cells: [
          cell(ids.math, { semester_mark: semester === 1 ? 5 : 4 }),
          cell(ids.physics, { semester_mark: null, midterm_avg: null, final_avg: null, lesson_avg: null }),
        ],
      },
      {
        student: { id: "00000000-0000-4000-8000-0000000000a2", first_name: "Bobur", last_name: "Rashidov" },
        gpa: null,
        absences: 0,
        lessons: 0,
        absence_rate: null,
        cells: [],
      },
    ],
  }
}

export const groupProgress: GroupProgress = groupProgressFor(1)
