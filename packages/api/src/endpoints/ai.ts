// AI assistants (student and admin).

import { api } from "../client"
import { keys } from "../keys"
import { queryOptions, seg, type RequestOptions } from "../query"
import type { NoContent, Page } from "../types/common"
import type {
  ChatCreateBody,
  ChatDetail,
  ChatItem,
  ChatMessageBody,
  ChatPatchBody,
  ChatsParams,
  MessageFeedbackBody,
  ToolCallRejectBody,
  TurnResult,
  UsageInfo,
  UsageParams,
  WebQuota,
} from "../types/ai"

/** GET /v1/ai/chats?assistant&cursor — student or admin. */
export function getAiChats(params?: ChatsParams, opts?: RequestOptions): Promise<Page<ChatItem>> {
  return api.get<Page<ChatItem>>("/v1/ai/chats", { ...opts, query: params })
}
export const getAiChatsQuery = (params?: ChatsParams) =>
  queryOptions({
    queryKey: keys.ai.chats(params),
    queryFn: ({ signal }) => getAiChats(params, { signal }),
  })

/** POST /v1/ai/chats — student (student assistant) or admin (admin assistant). */
export function postAiChats(body: ChatCreateBody, opts?: RequestOptions): Promise<ChatItem> {
  return api.post<ChatItem>("/v1/ai/chats", body, opts)
}

/** GET /v1/ai/chats/{id} — owner. */
export function getAiChat(id: string, opts?: RequestOptions): Promise<ChatDetail> {
  return api.get<ChatDetail>(`/v1/ai/chats/${seg(id)}`, opts)
}
export const getAiChatQuery = (id: string) =>
  queryOptions({ queryKey: keys.ai.chat(id), queryFn: ({ signal }) => getAiChat(id, { signal }) })

/** PATCH /v1/ai/chats/{id} — owner; rename. */
export function patchAiChat(id: string, body: ChatPatchBody, opts?: RequestOptions): Promise<ChatItem> {
  return api.patch<ChatItem>(`/v1/ai/chats/${seg(id)}`, body, opts)
}

/** DELETE /v1/ai/chats/{id} — owner; `204`. */
export function deleteAiChat(id: string, opts?: RequestOptions): Promise<NoContent> {
  return api.delete<NoContent>(`/v1/ai/chats/${seg(id)}`, opts)
}

/** POST /v1/ai/chats/{id}/messages — owner; `429 ai/limit-reached` at the limit. */
export function postAiChatMessages(id: string, body: ChatMessageBody, opts?: RequestOptions): Promise<TurnResult> {
  return api.post<TurnResult>(`/v1/ai/chats/${seg(id)}/messages`, body, opts)
}

/** Opens the SSE variant (`Accept: text/event-stream`) of a turn endpoint; read it with `readAiChatStream`. */
function streamTurn(path: string, body: unknown, opts?: RequestOptions): Promise<Response> {
  return api.request<Response>({
    method: "POST",
    path,
    body,
    headers: { Accept: "text/event-stream" },
    responseType: "stream",
    signal: opts?.signal,
  })
}

/**
 * Streaming variant of `POST /v1/ai/chats/{id}/messages` (`Accept: text/event-stream`): the raw SSE `Response`;
 * read it with `readAiChatStream`. A server that answers with JSON still works (check the content type).
 */
export function streamAiChatMessages(id: string, body: ChatMessageBody, opts?: RequestOptions): Promise<Response> {
  return streamTurn(`/v1/ai/chats/${seg(id)}/messages`, body, opts)
}

/** Streaming variant of `POST /v1/ai/chats/{id}/regenerate`. */
export function streamAiChatRegenerate(id: string, opts?: RequestOptions): Promise<Response> {
  return streamTurn(`/v1/ai/chats/${seg(id)}/regenerate`, undefined, opts)
}

/** Streaming variant of `POST /v1/ai/chats/{id}/tool-calls/{call_id}/approve`. */
export function streamAiChatToolCallApprove(id: string, callId: string, opts?: RequestOptions): Promise<Response> {
  return streamTurn(`/v1/ai/chats/${seg(id)}/tool-calls/${seg(callId)}/approve`, undefined, opts)
}

/** Streaming variant of `POST /v1/ai/chats/{id}/tool-calls/{call_id}/reject`. */
export function streamAiChatToolCallReject(
  id: string,
  callId: string,
  body?: ToolCallRejectBody,
  opts?: RequestOptions,
): Promise<Response> {
  return streamTurn(`/v1/ai/chats/${seg(id)}/tool-calls/${seg(callId)}/reject`, body ?? {}, opts)
}

/** POST /v1/ai/chats/{id}/regenerate — owner; answers the last user message again (P1b). */
export function postAiChatRegenerate(id: string, opts?: RequestOptions): Promise<TurnResult> {
  return api.post<TurnResult>(`/v1/ai/chats/${seg(id)}/regenerate`, undefined, opts)
}

/** POST /v1/ai/chats/{id}/messages/{seq}/feedback — owner; thumbs up or down on an assistant message (P1b); `204`. */
export function postAiChatMessageFeedback(
  id: string,
  seq: number,
  body: MessageFeedbackBody,
  opts?: RequestOptions,
): Promise<NoContent> {
  return api.post<NoContent>(`/v1/ai/chats/${seg(id)}/messages/${seg(seq)}/feedback`, body, opts)
}

/** POST /v1/ai/chats/{id}/tool-calls/{call_id}/approve — owner. */
export function postAiChatToolCallApprove(id: string, callId: string, opts?: RequestOptions): Promise<TurnResult> {
  return api.post<TurnResult>(`/v1/ai/chats/${seg(id)}/tool-calls/${seg(callId)}/approve`, undefined, opts)
}

/** POST /v1/ai/chats/{id}/tool-calls/{call_id}/reject — owner. */
export function postAiChatToolCallReject(
  id: string,
  callId: string,
  body?: ToolCallRejectBody,
  opts?: RequestOptions,
): Promise<TurnResult> {
  return api.post<TurnResult>(`/v1/ai/chats/${seg(id)}/tool-calls/${seg(callId)}/reject`, body ?? {}, opts)
}

/** GET /v1/ai/usage?assistant — bearer. */
export function getAiUsage(params?: UsageParams, opts?: RequestOptions): Promise<UsageInfo> {
  return api.get<UsageInfo>("/v1/ai/usage", { ...opts, query: params })
}
export const getAiUsageQuery = (params?: UsageParams) =>
  queryOptions({
    queryKey: keys.ai.usage(params?.assistant, params?.course_id),
    queryFn: ({ signal }) => getAiUsage(params, { signal }),
  })

/** GET /v1/ai/web-search — whether web search is on and today's searches (hide the toggle when `enabled` is false). */
export function getAiWebSearch(opts?: RequestOptions): Promise<WebQuota> {
  return api.get<WebQuota>("/v1/ai/web-search", opts)
}
export const getAiWebSearchQuery = () =>
  queryOptions({ queryKey: keys.ai.webSearch(), queryFn: ({ signal }) => getAiWebSearch({ signal }) })
