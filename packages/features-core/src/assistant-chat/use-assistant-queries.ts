"use client"

import {
  deleteAiChat,
  getAiChatQuery,
  getAiChatsQuery,
  getAiUsageQuery,
  keys,
  patchAiChat,
  postAiChatMessages,
  postAiChatToolCallApprove,
  postAiChatToolCallReject,
  postAiChats,
  isApiError,
  type AssistantKind,
  type ChatDetail,
  type ChatItem,
  type Page,
  type TurnResult,
} from "@ihsp/api"
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query"
import { applyTurn } from "./apply-turn"

const CHATS_LIMIT = 100

function chatsQueryOptions(assistant: AssistantKind) {
  return getAiChatsQuery({ assistant, limit: CHATS_LIMIT })
}

export function useChats(assistant: AssistantKind) {
  return useQuery(chatsQueryOptions(assistant))
}

export function useChat(id: string | null) {
  return useQuery({ ...getAiChatQuery(id ?? ""), enabled: id !== null })
}

export function useUsage(assistant: AssistantKind) {
  return useQuery(getAiUsageQuery({ assistant }))
}

function refreshChatList(queryClient: QueryClient, assistant: AssistantKind) {
  return queryClient.invalidateQueries({ queryKey: chatsQueryOptions(assistant).queryKey })
}

function storeTurn(queryClient: QueryClient, assistant: AssistantKind, chatId: string, turn: TurnResult) {
  queryClient.setQueryData<ChatDetail>(keys.ai.chat(chatId), (current) =>
    current ? applyTurn(current, turn) : current,
  )
  queryClient.setQueryData(keys.ai.usage(assistant), turn.usage)
  void refreshChatList(queryClient, assistant)
}

export function useCreateChat(assistant: AssistantKind) {
  const queryClient = useQueryClient()
  return useMutation<ChatItem, unknown, void>({
    mutationFn: () => postAiChats({ assistant }),
    onSuccess: () => refreshChatList(queryClient, assistant),
  })
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

export type SendMessageInput = { text: string; fileIds: string[] }

export function useSendMessage(chatId: string, assistant: AssistantKind) {
  const queryClient = useQueryClient()
  return useMutation<TurnResult, unknown, SendMessageInput>({
    mutationFn: ({ text, fileIds }) => postAiChatMessages(chatId, { text, file_ids: fileIds }),
    onSuccess: (turn) => storeTurn(queryClient, assistant, chatId, turn),
    onError: (error) => {
      // At the limit the usage bar must show the real numbers and the input must lock.
      if (isApiError(error) && error.type === "ai/limit-reached") {
        void queryClient.invalidateQueries({ queryKey: keys.ai.usage(assistant) })
      }
    },
  })
}

export type DecideToolCallInput =
  | { callId: string; decision: "approve" }
  | { callId: string; decision: "reject"; reason?: string }

export function useDecideToolCall(chatId: string, assistant: AssistantKind) {
  const queryClient = useQueryClient()
  return useMutation<TurnResult, unknown, DecideToolCallInput>({
    mutationFn: (input) =>
      input.decision === "approve"
        ? postAiChatToolCallApprove(chatId, input.callId)
        : postAiChatToolCallReject(chatId, input.callId, input.reason ? { reason: input.reason } : {}),
    onSuccess: (turn) => storeTurn(queryClient, assistant, chatId, turn),
    onError: () => {
      // Expired, superseded or already decided in another tab: show the server's version of the chat.
      void queryClient.invalidateQueries({ queryKey: keys.ai.chat(chatId) })
    },
  })
}
