// LMS — exam block sittings (Bluebook-style). Mirrors handlers/exam.py of iht-backend.

import { api } from "../client"
import { queryOptions, seg, type RequestOptions } from "../query"
import type { Answer } from "../types/lms-learning"
import type { ExamSession } from "../types/lms-widgets"

const base = (stepId: string, blockId: string) => `/v1/lms/steps/${seg(stepId)}/blocks/${seg(blockId)}/exam`

/** GET .../exam — enrolled; my sitting (a module past its deadline is closed on the way). */
export function getLmsExamSession(stepId: string, blockId: string, opts?: RequestOptions): Promise<ExamSession> {
  return api.get<ExamSession>(base(stepId, blockId), opts)
}

export const getLmsExamSessionQuery = (stepId: string, blockId: string) =>
  queryOptions({
    queryKey: ["lms", "steps", stepId, "exam", blockId] as const,
    queryFn: ({ signal }) => getLmsExamSession(stepId, blockId, { signal }),
  })

/** POST .../exam/start — begin the next module (or return the open one). */
export function postLmsExamStart(stepId: string, blockId: string, opts?: RequestOptions): Promise<ExamSession> {
  return api.post<ExamSession>(`${base(stepId, blockId)}/start`, {}, opts)
}

/** PUT .../exam/answers — merge answers into the open module; `lms/exam-module-closed` after the grace. */
export function putLmsExamAnswers(
  stepId: string,
  blockId: string,
  moduleId: string,
  answers: Record<string, Answer>,
  opts?: RequestOptions,
): Promise<ExamSession> {
  return api.put<ExamSession>(`${base(stepId, blockId)}/answers`, { module_id: moduleId, answers }, opts)
}

/** POST .../exam/submit — submit the open module; the last one finishes the exam. */
export function postLmsExamSubmit(
  stepId: string,
  blockId: string,
  moduleId: string,
  opts?: RequestOptions,
): Promise<ExamSession> {
  return api.post<ExamSession>(`${base(stepId, blockId)}/submit`, { module_id: moduleId }, opts)
}
