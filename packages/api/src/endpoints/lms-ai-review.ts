// LMS — the AI review block: a student's review chat and the staff list of reviewed work.
// mirrors openapi (app/interfaces/http/v1/lms_ai_review/router.py of iht-backend); hand-written until the export lands.

import { api } from "../client"
import { queryOptions, seg, type RequestOptions } from "../query"

export type AiReviewSessionStatus = "open" | "reviewed"

// mirrors openapi: AiReviewAttachmentView
export type AiReviewAttachment = { file_id: string; name: string; content_type: string }

// mirrors openapi: AiReviewMessageView — `openui` is a fenced, validated ```openui block.
export type AiReviewMessage = {
  id: string
  role: "student" | "assistant"
  text: string | null
  openui: string | null
  attachments: AiReviewAttachment[]
  kind: "chat" | "question" | "review"
  created_at: string
}

// mirrors openapi: AiReviewSessionView
export type AiReviewSession = {
  id: string
  step_id: string
  block_id: string
  status: AiReviewSessionStatus
  submissions_left: number
  messages: AiReviewMessage[]
}

// mirrors openapi: AiReviewSessionSummaryView
export type AiReviewSessionSummary = {
  id: string
  status: AiReviewSessionStatus
  created_at: string
  submissions_used: number
}

// mirrors openapi: AiReviewMessagesView — the new messages of the exchange.
export type AiReviewMessages = { messages: AiReviewMessage[] }

// mirrors openapi: AiReviewSubmissionView
export type AiReviewSubmission = {
  session_id: string
  student: { id: string; name: string }
  status: AiReviewSessionStatus
  submitted_at: string | null
  review_openui: string | null
}

// mirrors openapi: AiReviewMessageBody / AiReviewSubmitBody
export type AiReviewMessageBody = { text: string; file_ids: string[] }
export type AiReviewSubmitBody = { file_ids: string[]; note: string }

function blockPath(stepId: string, blockId: string): string {
  return `/v1/lms/steps/${seg(stepId)}/blocks/${seg(blockId)}/ai-review/sessions`
}

/** POST /v1/lms/steps/{step_id}/blocks/{block_id}/ai-review/sessions — enrolled; a new conversation. */
export function postLmsAiReviewSession(
  stepId: string,
  blockId: string,
  opts?: RequestOptions,
): Promise<AiReviewSession> {
  return api.request<AiReviewSession>({ ...opts, method: "POST", path: blockPath(stepId, blockId) })
}

/** GET /v1/lms/steps/{step_id}/blocks/{block_id}/ai-review/sessions — my conversations, newest first. */
export function getLmsAiReviewSessions(
  stepId: string,
  blockId: string,
  opts?: RequestOptions,
): Promise<{ items: AiReviewSessionSummary[] }> {
  return api.get<{ items: AiReviewSessionSummary[] }>(blockPath(stepId, blockId), opts)
}

export const getLmsAiReviewSessionsQuery = (stepId: string, blockId: string) =>
  queryOptions({
    queryKey: ["lms", "ai-review", "sessions", stepId, blockId] as const,
    queryFn: ({ signal }) => getLmsAiReviewSessions(stepId, blockId, { signal }),
  })

/** GET /v1/lms/ai-review/sessions/{session_id} — one of my conversations with its messages. */
export function getLmsAiReviewSession(sessionId: string, opts?: RequestOptions): Promise<AiReviewSession> {
  return api.get<AiReviewSession>(`/v1/lms/ai-review/sessions/${seg(sessionId)}`, opts)
}

export const getLmsAiReviewSessionQuery = (sessionId: string) =>
  queryOptions({
    queryKey: ["lms", "ai-review", "session", sessionId] as const,
    queryFn: ({ signal }) => getLmsAiReviewSession(sessionId, { signal }),
  })

/** POST /v1/lms/ai-review/sessions/{id}/messages — the reviewer answers or asks; 409 `lms/ai-review-closed`. */
export function postLmsAiReviewMessage(
  sessionId: string,
  body: AiReviewMessageBody,
  opts?: RequestOptions,
): Promise<AiReviewMessages> {
  return api.request<AiReviewMessages>({
    ...opts,
    method: "POST",
    path: `/v1/lms/ai-review/sessions/${seg(sessionId)}/messages`,
    body,
  })
}

/** POST /v1/lms/ai-review/sessions/{id}/submit — spends one submission; 409 `lms/ai-review-no-submissions-left`. */
export function postLmsAiReviewSubmit(
  sessionId: string,
  body: AiReviewSubmitBody,
  opts?: RequestOptions,
): Promise<AiReviewMessages> {
  return api.request<AiReviewMessages>({
    ...opts,
    method: "POST",
    path: `/v1/lms/ai-review/sessions/${seg(sessionId)}/submit`,
    body,
  })
}

/** GET /v1/lms/courses/{course_id}/steps/{step_id}/blocks/{block_id}/ai-review/submissions — course staff. */
export function getLmsAiReviewSubmissions(
  courseId: string,
  stepId: string,
  blockId: string,
  opts?: RequestOptions,
): Promise<{ items: AiReviewSubmission[] }> {
  return api.get<{ items: AiReviewSubmission[] }>(
    `/v1/lms/courses/${seg(courseId)}/steps/${seg(stepId)}/blocks/${seg(blockId)}/ai-review/submissions`,
    opts,
  )
}

export const getLmsAiReviewSubmissionsQuery = (courseId: string, stepId: string, blockId: string) =>
  queryOptions({
    queryKey: ["lms", "course", courseId, "ai-review", stepId, blockId, "submissions"] as const,
    queryFn: ({ signal }) => getLmsAiReviewSubmissions(courseId, stepId, blockId, { signal }),
  })
