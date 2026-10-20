import type { AdminWorkOffItem, WorkOffGroupBy, WorkOffStatsRow } from "@ihsp/api"
import { ids, uuid } from "./world"

/** A work-off with the ids the admin filters use (the response items carry names only). */
export type AdminWorkOffRecord = AdminWorkOffItem & {
  subject_id: string
  teacher_id: string | null
  group_id: string | null
}

const base = {
  lesson_id: uuid(5, 31),
  done_at: null,
  created_at: "2026-10-05T10:00:00Z",
  teacher_id: ids.teacherKalandarova,
  teacher_name: "Kalandarova Gavxar",
  group_id: ids.group2TN2,
  group_name: "2TN2",
  student_id: ids.student,
  student_name: "Brastilov Aleksey",
  status: "assigned" as const,
  due_date: "2026-10-12",
}

export const adminWorkOffRecords: AdminWorkOffRecord[] = [
  {
    ...base,
    id: uuid(92, 1),
    date: "2026-10-05",
    period: 2,
    subject_id: ids.math,
    subject_name: "Mathematics",
    text: "Redo exercises 4 to 9",
  },
  {
    ...base,
    id: uuid(92, 2),
    date: "2026-10-06",
    period: 3,
    subject_id: ids.math,
    subject_name: "Mathematics",
    student_id: ids.student2,
    student_name: "Ivanova Maria",
    text: "Learn the theorem",
    status: "done",
    done_at: "2026-10-07T08:00:00Z",
  },
  {
    ...base,
    id: uuid(92, 3),
    date: "2026-10-06",
    period: 4,
    subject_id: ids.physics,
    subject_name: "Physics",
    teacher_id: ids.teacherSmirnova,
    teacher_name: "Smirnova Olga",
    text: "Lab report",
  },
]

export const adminWorkOffStatsRows: Record<WorkOffGroupBy, WorkOffStatsRow[]> = {
  subject: [
    { key: ids.math, name: "Mathematics", open_count: 4, done_count: 2 },
    { key: ids.physics, name: "Physics", open_count: 1, done_count: 0 },
  ],
  teacher: [
    { key: ids.teacherKalandarova, name: "Kalandarova Gavxar", open_count: 4, done_count: 2 },
    { key: ids.teacherSmirnova, name: "Smirnova Olga", open_count: 1, done_count: 0 },
  ],
  group: [{ key: ids.group2TN2, name: "2TN2", open_count: 5, done_count: 2 }],
  student: [
    { key: ids.student, name: "Brastilov Aleksey", open_count: 3, done_count: 1 },
    { key: ids.student2, name: "Ivanova Maria", open_count: 2, done_count: 1 },
  ],
}
