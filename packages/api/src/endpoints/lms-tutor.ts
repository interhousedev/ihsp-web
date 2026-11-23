// LMS lesson AI: the Socratic step tutor (learner) and video check suggestions (author).

import type { components } from "../generated/openapi"
import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, seg, type RequestOptions } from "../query"

type S = components["schemas"]

export type TutorAskBody = S["TutorAskBody"]
export type TutorLanguage = NonNullable<TutorAskBody["language"]>

/** A message of the tutor conversation. */
export type TutorMessage = S["TutorMessageOut"]

/** The caller's conversation in the step; `remaining_today` is null for staff (no cap). */
export type TutorConversation = S["TutorConversationOut"]

/** The transcript as plain text; lines may start with `mm:ss`. */
export type VideoChecksBody = S["VideoChecksBody"]

/** A suggested pause-and-predict question. */
export type VideoCheck = S["VideoCheckOut"]

export type RecapCard = S["RecapCardOut"]

/** Suggestions only; nothing is saved until the author saves the draft. */
export type VideoChecks = S["VideoChecksOut"]

/** GET /v1/lms/steps/{step_id}/tutor — enrolled learner; `403 lms/tutor-disabled` when the course turned it off. */
export function getLmsTutor(stepId: string, opts?: RequestOptions): Promise<TutorConversation> {
  return api.get<TutorConversation>(`/v1/lms/steps/${seg(stepId)}/tutor`, opts)
}
export const getLmsTutorQuery = (stepId: string) =>
  queryOptions({
    queryKey: keys.lms.tutor(stepId),
    queryFn: ({ signal }) => getLmsTutor(stepId, { signal }),
  })

/** POST /v1/lms/steps/{step_id}/tutor — asks the tutor; `429 lms/tutor-daily-limit` past the daily cap. */
export function postLmsTutor(stepId: string, body: TutorAskBody, opts?: RequestOptions): Promise<TutorConversation> {
  return api.post<TutorConversation>(`/v1/lms/steps/${seg(stepId)}/tutor`, body, opts)
}

/** POST /v1/lms/courses/{course_id}/steps/{step_id}/blocks/{block_id}/video-checks/suggest — course author. */
export function postLmsVideoChecksSuggest(
  courseId: string,
  stepId: string,
  blockId: string,
  body: VideoChecksBody,
  opts?: RequestOptions,
): Promise<VideoChecks> {
  return api.post<VideoChecks>(
    `/v1/lms/courses/${seg(courseId)}/steps/${seg(stepId)}/blocks/${seg(blockId)}/video-checks/suggest`,
    body,
    opts,
  )
}
