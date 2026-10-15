"use client"

import {
  deleteAiChat,
  getAiChatQuery,
  getAiChatsQuery,
  getAiUsageQuery,
  keys,
  patchAiChat,
  postAiChatMessageFeedback,
  postAiChatRegenerate,
  postAiChatToolCallApprove,
  postAiChatToolCallReject,
  postAiChats,
  streamAiChatRegenerate,
  streamAiChatToolCallApprove,
  streamAiChatToolCallReject,
  isApiError,
  type AiStreamEvent,
  type AssistantKind,
  type ChatDetail,
  type ChatItem,
  type Page,
  type TurnResult,
} from "@ihsp/api"
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query"
import { useRefreshWebQuota } from "../web-search"
import { applyTurn } from "./apply-turn"
import { sendStreamed, streamedTurn } from "./stream-turn"

const CHATS_LIMIT = 100

function chatsQueryOptions(assistant: AssistantKind, courseId?: string) {
  return getAiChatsQuery({ assistant, limit: CHATS_LIMIT, ...(courseId ? { course_id: courseId } : {}) })
}

/** The caller's chats of an assistant; the author assistant lists the chats of one course (`courseId`). */
export function useChats(assistant: AssistantKind, courseId?: string) {
  return useQuery(chatsQueryOptions(assistant, courseId))
}

export function useChat(id: string | null) {
  return useQuery({ ...getAiChatQuery(id ?? ""), enabled: id !== null })
}

export function useUsage(assistant: AssistantKind, courseId?: string) {
  return useQuery(getAiUsageQuery({ assistant, ...(courseId ? { course_id: courseId } : {}) }))
}

function refreshChatList(queryClient: QueryClient, assistant: AssistantKind) {
  return queryClient.invalidateQueries({ queryKey: chatsQueryOptions(assistant).queryKey })
}

function storeTurn(queryClient: QueryClient, assistant: AssistantKind, chatId: string, turn: TurnResult) {
  queryClient.setQueryData<ChatDetail>(keys.ai.chat(chatId), (current) =>
    current ? applyTurn(current, turn) : current,
  )
  queryClient.setQueryData(keys.ai.usage(assistant), turn.usage)
  // The author assistant's budget is read per course: refresh whatever course it was read for.
  if (assistant === "lms_author") void queryClient.invalidateQueries({ queryKey: keys.ai.usage(assistant) })
  void refreshChatList(queryClient, assistant)
}

export type ChatTier = "fast" | "smart"

export type CreateChatInput = { tier?: ChatTier }

export function useCreateChat(assistant: AssistantKind, courseId?: string) {
  const queryClient = useQueryClient()
  return useMutation<ChatItem, unknown, CreateChatInput | undefined>({
    mutationFn: (input) =>
      postAiChats({
        assistant,
        ...(input?.tier ? { tier: input.tier } : {}),
        ...(courseId ? { course_id: courseId } : {}),
      }),
    onSuccess: () => refreshChatList(queryClient, assistant),
  })
}

const SEARCH_LIMIT = 20

/** Server-side title search for the search dialog (`GET /ai/chats?q=`); idle while `q` is empty. */
export function useSearchChats(assistant: AssistantKind, q: string) {
  const term = q.trim()
  return useQuery({ ...getAiChatsQuery({ assistant, q: term, limit: SEARCH_LIMIT }), enabled: term !== "" })
}

export function useRenameChat(assistant: AssistantKind) {
  const queryClient = useQueryClient()
  return useMutation<ChatItem, unknown, { id: string; title: string }>({
    mutationFn: ({ id, title }) => patchAiChat(id, { title }),
    onSuccess: (chat) => {
      queryClient.setQueryData<ChatDetail>(keys.ai.chat(chat.id), (current) =>
        current ? { ...current, title: chat.title } : current,
      )
      queryClient.setQueryData<Page<ChatItem>>(chatsQueryOptions(assistant).queryKey, (current) =>
        current
          ? {
              ...current,
              items: current.items.map((item) => (item.id === chat.id ? { ...item, title: chat.title } : item)),
            }
          : current,
      )
    },
  })
}

export function useDeleteChat(assistant: AssistantKind) {
  const queryClient = useQueryClient()
  return useMutation<unknown, unknown, string>({
    mutationFn: (id) => deleteAiChat(id),
    onSuccess: (_result, id) => {
      queryClient.removeQueries({ queryKey: keys.ai.chat(id) })
      queryClient.setQueryData<Page<ChatItem>>(chatsQueryOptions(assistant).queryKey, (current) =>
        current ? { ...current, items: current.items.filter((item) => item.id !== id) } : current,
      )
    },
  })
}

export type SendMessageInput = {
  text: string
  fileIds: string[]
  /** Answer with a web search (`web_search: true`); left out of the body when false. */
  webSearch?: boolean
  /** A slash command: the server maps it to a prompt or tool; `text` is then only what the chat shows meanwhile. */
  command?: { name: string; args: string }
  /** Aborts the request (the stop button). */
  signal?: AbortSignal
  /** Gets the status lines, steps and answer pieces while the answer streams. */
  onEvent?: (event: AiStreamEvent) => void
}

export function useSendMessage(chatId: string, assistant: AssistantKind) {
  const queryClient = useQueryClient()
  const refreshWebQuota = useRefreshWebQuota()
  return useMutation<TurnResult, unknown, SendMessageInput>({
    mutationFn: ({ text, fileIds, webSearch, command, signal, onEvent }) =>
      sendStreamed(
        chatId,
        {
          text: command ? "" : text,
          file_ids: fileIds,
          ...(command ? { command: command.name, args: command.args } : {}),
          ...(webSearch ? { web_search: true } : {}),
        },
        { ...(signal ? { signal } : {}), ...(onEvent ? { onEvent } : {}) },
      ),
    onSuccess: (turn) => storeTurn(queryClient, assistant, chatId, turn),
    // A search spends the quota (and a refusal means it changed): read today's searches again either way.
    onSettled: (_turn, _error, input) => {
      if (input.webSearch) void refreshWebQuota()
    },
    onError: (error) => {
      // At the limit the usage bar must show the real numbers and the input must lock.
      if (isApiError(error) && (error.type === "ai/limit-reached" || error.type === "ai/smart-weekly-limit")) {
        void queryClient.invalidateQueries({ queryKey: keys.ai.usage(assistant) })
      }
    },
  })
}

/** Hears the status lines, steps and text pieces of a streamed turn. */
type LiveListener = { onEvent?: (event: AiStreamEvent) => void }

export type DecideToolCallInput = (
  | { callId: string; decision: "approve" }
  | { callId: string; decision: "reject"; reason?: string }
) &
  LiveListener

export function useDecideToolCall(chatId: string, assistant: AssistantKind) {
  const queryClient = useQueryClient()
  return useMutation<TurnResult, unknown, DecideToolCallInput>({
    mutationFn: (input) => {
      const listen = input.onEvent ? { onEvent: input.onEvent } : {}
      if (input.decision === "approve") {
        return streamedTurn(
          () => streamAiChatToolCallApprove(chatId, input.callId),
          () => postAiChatToolCallApprove(chatId, input.callId),
          listen,
        )
      }
      const body = input.reason ? { reason: input.reason } : {}
      return streamedTurn(
        () => streamAiChatToolCallReject(chatId, input.callId, body),
        () => postAiChatToolCallReject(chatId, input.callId, body),
        listen,
      )
    },
    onSuccess: (turn) => storeTurn(queryClient, assistant, chatId, turn),
    onError: () => {
      // Expired, superseded or already decided in another tab: show the server's version of the chat.
      void queryClient.invalidateQueries({ queryKey: keys.ai.chat(chatId) })
    },
  })
}

/** Answers the last user message again; the new answer replaces the one with the same `seq` (P1b). */
export function useRegenerate(chatId: string, assistant: AssistantKind) {
  const queryClient = useQueryClient()
  return useMutation<TurnResult, unknown, LiveListener | void>({
    mutationFn: (input) =>
      streamedTurn(
        () => streamAiChatRegenerate(chatId),
        () => postAiChatRegenerate(chatId),
        input?.onEvent ? { onEvent: input.onEvent } : {},
      ),
    onSuccess: (turn) => storeTurn(queryClient, assistant, chatId, turn),
    onError: (error) => {
      if (isApiError(error) && error.type === "ai/limit-reached") {
        void queryClient.invalidateQueries({ queryKey: keys.ai.usage(assistant) })
      }
    },
  })
}

export type FeedbackInput = { seq: number; rating: "up" | "down" }

/** Thumbs up or down on an assistant message (P1b). */
export function useFeedback(chatId: string) {
  return useMutation<unknown, unknown, FeedbackInput>({
    mutationFn: ({ seq, rating }) => postAiChatMessageFeedback(chatId, seq, { rating }),
  })
}
