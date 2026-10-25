import type { StaffGroupMaterial, StaffSubject, TeachingLesson, TeachingStudent } from "@ihsp/api"
import { groupStudents } from "./schedule"
import { ids, uuid } from "./world"

/** Ids of the teacher's own subject materials; kind 71 is free in `uuid`. */
export const staffMaterialIds = {
  mathMine: uuid(71, 1),
  mathGroup: uuid(71, 2),
}

/** The subjects the demo teacher teaches: Mathematics to 2TN2, English to the two halves of 2TN2. */
export const staffSubjects: StaffSubject[] = [
  {
    subject_id: ids.english,
    name: "English",
    groups: [
      { group_id: ids.group2TN2, group_name: "2TN2", subgroup: 1 },
      { group_id: ids.group2TN2, group_name: "2TN2", subgroup: 2 },
    ],
  },
  {
    subject_id: ids.math,
    name: "Mathematics",
    groups: [{ group_id: ids.group2TN2, group_name: "2TN2", subgroup: null }],
  },
]

/** The EMIS ids of the subjects above, as in `subjectMaterials`. */
export const staffSubjectEmisIds: Record<string, number> = { [ids.math]: 101, [ids.english]: 103 }

/** The teacher's own materials to start with: one for all groups and one for 2TN2 of Mathematics. */
export const staffMaterials: StaffGroupMaterial[] = [
  {
    id: staffMaterialIds.mathGroup,
    edu_subject_id: 101,
    kind: "link",
    title: "2TN2 problem set",
    url: "https://example.org/problem-set",
    file_id: null,
    library_item_id: null,
    position: 1,
    created_at: "2026-09-10T08:00:00Z",
    group_id: ids.group2TN2,
    group_name: "2TN2",
    subgroup: null,
  },
]

/** A material for all the teacher's groups (no group). */
export const staffMineMaterial = {
  id: staffMaterialIds.mathMine,
  edu_subject_id: 101,
  kind: "link" as const,
  title: "My Mathematics cheat sheet",
  url: "https://example.org/cheat-sheet",
  file_id: null,
  library_item_id: null,
  position: 1,
  created_at: "2026-09-09T08:00:00Z",
}

/** The lessons of a subject group in the teacher's timetable: one this week, one next week. */
export function teachingLessons(groupName: string): TeachingLesson[] {
  return [
    {
      id: uuid(72, 1),
      date: "2026-10-08",
      period: 2,
      starts_at: "2026-10-08T04:30:00Z",
      ends_at: "2026-10-08T05:50:00Z",
      room_name: "204",
      group_names: [groupName],
      status: "scheduled",
      topic: "Quadratic equations",
      homework_text: "Ex. 4-7",
      homework_due_date: null,
    },
    {
      id: uuid(72, 2),
      date: "2026-10-15",
      period: 3,
      starts_at: "2026-10-15T06:00:00Z",
      ends_at: "2026-10-15T07:20:00Z",
      room_name: "204",
      group_names: [groupName],
      status: "scheduled",
      topic: null,
      homework_text: null,
      homework_due_date: null,
    },
  ]
}

/** The students of 2TN2 as the subject group pages list them. */
export const teachingRoster = groupStudents.map(({ user_id, first_name, last_name, subgroup }) => ({
  user_id,
  first_name,
  last_name,
  subgroup,
}))

/** A student's record in a subject: three marks (average 4.33), one homework done, one absence. */
export function teachingStudentRecord(subject: StaffSubject, student: TeachingStudent["student"]): TeachingStudent {
  return {
    subject_id: subject.subject_id,
    subject_name: subject.name,
    group_id: ids.group2TN2,
    group_name: "2TN2",
    student,
    semester: 4,
    marks: [
      { semester: 4, type: "lesson", value: 5, date: "2026-10-06", lesson_id: null },
      { semester: 4, type: "lesson", value: 4, date: "2026-10-01", lesson_id: null },
      { semester: 4, type: "midterm", value: 4, date: "2026-09-25", lesson_id: null },
    ],
    average: 4.33,
    semester_mark: null,
    homework: [
      {
        lesson_id: uuid(72, 1),
        date: "2026-10-06",
        due_date: "2026-10-08",
        text: "Ex. 4-7",
        done_at: "2026-10-07T04:00:00Z",
        note: "Photos uploaded to Drive",
      },
    ],
    absences: 1,
    lessons_with_attendance: 12,
    absent_lessons: [{ lesson_id: uuid(72, 3), date: "2026-09-30", excused: false }],
  }
}
