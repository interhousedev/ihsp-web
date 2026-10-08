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
  ToolCallRejectBody,
  TurnResult,
  UsageInfo,
  UsageParams,
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
    queryKey: keys.ai.usage(params?.assistant),
    queryFn: ({ signal }) => getAiUsage(params, { signal }),
  })
