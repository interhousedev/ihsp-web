import { api, seg, type MyLevel } from "@ihsp/api"

/**
 * Typed adapter of the Coach routes of `openapi.json` (`/v1/lms/steps/{id}/coach/sessions`, `/v1/lms/coach/sessions/*`).
 * `packages/api` has no endpoint module for them yet; move these functions there when it grows one.
 */
export type CoachTrigger = "learner_tap" | "wrong_answer" | "attempts_exhausted" | "idle"
export type CoachOutcome = "resolved" | "abandoned" | "escalated"
export type CoachSession = { id: string; closed: boolean; hint_level: number; mode: string }
export type CoachTurn = { hint_level: number; role: string; text: string }
export type CoachReply = { ask_back: boolean; hint_level: number; message: string }
export type LatestCoachSession = { session: CoachSession | null; turns: CoachTurn[] }

export function getLatestCoachSession(stepId: string): Promise<LatestCoachSession> {
  return api.get<LatestCoachSession>(`/v1/lms/steps/${seg(stepId)}/coach/sessions`, { query: { latest: 1 } })
}

export function openCoachSession(stepId: string, trigger: CoachTrigger, blockId?: string): Promise<CoachSession> {
  return api.post<CoachSession>(`/v1/lms/steps/${seg(stepId)}/coach/sessions`, { trigger, block_id: blockId ?? null })
}

export function sendCoachTurn(sessionId: string, message: string): Promise<CoachReply> {
  return api.post<CoachReply>(`/v1/lms/coach/sessions/${seg(sessionId)}/turns`, { message })
}

/** POST /v1/lms/coach/sessions/{id}/hint: the next rung of the hint ladder. */
export function requestCoachHint(sessionId: string): Promise<CoachReply> {
  return api.post<CoachReply>(`/v1/lms/coach/sessions/${seg(sessionId)}/hint`)
}

/** POST /v1/lms/coach/sessions/{id}/explain-mistake: why the learner's answer is wrong. */
export function explainCoachMistake(sessionId: string, answer: string): Promise<CoachReply> {
  return api.post<CoachReply>(`/v1/lms/coach/sessions/${seg(sessionId)}/explain-mistake`, { answer })
}

/** GET /v1/lms/me/level: the learner's level on the platform, or in a course with `courseId`. */
export function getMyLevel(courseId?: string): Promise<MyLevel> {
  return api.get<MyLevel>("/v1/lms/me/level", courseId ? { query: { course_id: courseId } } : undefined)
}

export function closeCoachSession(sessionId: string, outcome: CoachOutcome): Promise<{ outcome: CoachOutcome }> {
  return api.post<{ outcome: CoachOutcome }>(`/v1/lms/coach/sessions/${seg(sessionId)}/close`, { outcome })
}
