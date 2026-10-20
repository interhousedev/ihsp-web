import type { MyWorkOff } from "@ihsp/api"
import { uuid } from "./world"

/** A work-off of the student with defaults; override what a test cares about. */
export function myWorkOff(overrides: Partial<MyWorkOff> = {}): MyWorkOff {
  return {
    id: uuid(80, 1),
    lesson_id: uuid(81, 1),
    date: "2026-10-05",
    period: 3,
    subject_name: "Mathematics",
    teacher_name: "Rakhimov A.",
    text: "Solve exercises 12-15.\nWrite the proof of the theorem.",
    status: "assigned",
    due_date: "2099-12-31",
    done_at: null,
    created_at: "2026-10-05T10:00:00Z",
    ...overrides,
  }
}

export const myWorkOffs: MyWorkOff[] = [
  myWorkOff(),
  myWorkOff({
    id: uuid(80, 2),
    lesson_id: uuid(81, 2),
    date: "2026-10-02",
    period: 1,
    subject_name: "Physics",
    teacher_name: null,
    text: "Read chapter 4.",
    due_date: "2020-01-01",
  }),
  myWorkOff({
    id: uuid(80, 3),
    lesson_id: uuid(81, 3),
    date: "2026-09-28",
    subject_name: "History",
    text: "Essay.",
    status: "done",
    done_at: "2026-09-30T08:00:00Z",
    due_date: null,
  }),
]
