// Feedback — send a report (bearer), read my reports and one report with its responses.

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, seg, type RequestOptions } from "../query"
import type { FeedbackCreateBody, FeedbackDetailOut, FeedbackMineResponse, FeedbackOut } from "../types/feedback"

/** POST /v1/feedback — bearer; 201 with the created report. 429 when the user sends too often. */
export function postFeedback(body: FeedbackCreateBody, opts?: RequestOptions): Promise<FeedbackOut> {
  return api.post<FeedbackOut>("/v1/feedback", body, opts)
}

/** GET /v1/feedback/mine — bearer; the caller's own reports, newest first. */
export function getMyFeedback(opts?: RequestOptions): Promise<FeedbackMineResponse> {
  return api.get<FeedbackMineResponse>("/v1/feedback/mine", opts)
}
export const getMyFeedbackQuery = () =>
  queryOptions({ queryKey: keys.feedback.mine(), queryFn: ({ signal }) => getMyFeedback({ signal }) })

/** GET /v1/feedback/{id} — the report with its responses. */
export function getFeedback(id: string, opts?: RequestOptions): Promise<FeedbackDetailOut> {
  return api.get<FeedbackDetailOut>(`/v1/feedback/${seg(id)}`, opts)
}
export const getFeedbackQuery = (id: string) =>
  queryOptions({
    queryKey: keys.feedback.detail(id),
    queryFn: ({ signal }) => getFeedback(id, { signal }),
  })
