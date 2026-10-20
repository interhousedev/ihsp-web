import type { WorkOffItem, WorkOffTemplate } from "@ihsp/api"
import { FIXTURE_NOW, ids, uuid } from "./world"

export const workOffTemplateIds = { default: uuid(0x5a, 1), second: uuid(0x5a, 2) }

/** The teacher's templates: the first one is the default. */
export const workOffTemplates: WorkOffTemplate[] = [
  {
    id: workOffTemplateIds.default,
    text: "Solve problems 1-5 from the textbook",
    is_default: true,
    created_at: "2026-09-01T08:00:00Z",
    updated_at: "2026-09-01T08:00:00Z",
  },
  {
    id: workOffTemplateIds.second,
    text: "Write a short summary of the topic",
    is_default: false,
    created_at: "2026-09-02T08:00:00Z",
    updated_at: "2026-09-02T08:00:00Z",
  },
]

/** A work-off of `student2` for `lessonId`, still to be done. */
export function makeWorkOff(lessonId: string, overrides: Partial<WorkOffItem> = {}): WorkOffItem {
  return {
    id: uuid(0x5b, 1),
    lesson_id: lessonId,
    student_id: ids.student2,
    template_id: workOffTemplateIds.default,
    text: "Solve problems 1-5 from the textbook",
    status: "assigned",
    due_date: "2026-10-14",
    done_at: null,
    assigned_by: ids.teacherKalandarova,
    created_at: FIXTURE_NOW,
    updated_at: FIXTURE_NOW,
    ...overrides,
  }
}
