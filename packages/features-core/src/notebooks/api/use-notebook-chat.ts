"use client"

import {
  deleteNotebookChat,
  getNotebookChatQuery,
  keys,
  postNotebookFeedback,
  postNotebookMessage,
  postNotebookRegenerate,
  postSaveNote,
  type NotebookChatHistory,
  type NotebookFeedbackBody,
  type NotebookMessage,
  type NotebookMessageBody,
  type NotebookTurn,
  type NotebookUsage,
  type SourceItem,
} from "@ihsp/api"
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query"

/** The saved conversation of a notebook (the last 200 messages, ascending). */
export function useNotebookChat(notebookId: string) {
  return useQuery(getNotebookChatQuery(notebookId))
}

/**
 * Puts the messages of a finished turn into the history: a message with the same `seq` is replaced (regenerate), the
 * others are added; the list stays sorted by `seq`.
 */
export function applyNotebookTurn(
  history: NotebookChatHistory | undefined,
  messages: readonly NotebookMessage[],
): NotebookChatHistory {
  const bySeq = new Map<number, NotebookMessage>()
  for (const message of history?.messages ?? []) bySeq.set(message.seq, message)
  for (const message of messages) bySeq.set(message.seq, message)
  return { messages: [...bySeq.values()].toSorted((a, b) => a.seq - b.seq) }
}

/** Stores a finished turn: history, the usage numbers and (the first answer may rename the notebook) the notebook. */
export function storeNotebookTurn(
  queryClient: QueryClient,
  notebookId: string,
  messages: readonly NotebookMessage[],
  usage: NotebookUsage | undefined,
): void {
  queryClient.setQueryData<NotebookChatHistory>(keys.notebooks.chat(notebookId), (current) =>
    applyNotebookTurn(current, messages),
  )
  if (usage) queryClient.setQueryData(keys.notebooks.usage(), usage)
  void queryClient.invalidateQueries({ queryKey: keys.notebooks.detail(notebookId) })
}

/**
 * One grounded question as JSON (no streaming): used by the "Explain" buttons of the viewers. The answer also joins
 * the notebook chat history. The chat panel has its own streaming hook.
 */
export function useAskNotebook(notebookId: string) {
  const queryClient = useQueryClient()
  return useMutation<NotebookTurn, unknown, NotebookMessageBody>({
    mutationFn: (body) => postNotebookMessage(notebookId, body),
    onSuccess: (turn) =>
      storeNotebookTurn(queryClient, notebookId, [turn.user_message, turn.assistant_message], turn.usage),
    onError: (error) => {
      if (typeof error === "object" && error !== null && "type" in error) {
        void queryClient.invalidateQueries({ queryKey: keys.notebooks.usage() })
      }
    },
  })
}

/** Answers the last user message again (P1b). */
export function useRegenerateAnswer(notebookId: string) {
  const queryClient = useQueryClient()
  return useMutation<NotebookTurn, unknown, void>({
    mutationFn: () => postNotebookRegenerate(notebookId),
    onSuccess: (turn) =>
      storeNotebookTurn(queryClient, notebookId, [turn.user_message, turn.assistant_message], turn.usage),
  })
}

export function useDeleteNotebookChat(notebookId: string) {
  const queryClient = useQueryClient()
  return useMutation<unknown, unknown, void>({
    mutationFn: () => deleteNotebookChat(notebookId),
    onSuccess: () => {
      queryClient.setQueryData<NotebookChatHistory>(keys.notebooks.chat(notebookId), { messages: [] })
    },
  })
}

/** Thumbs up or down on an answer (P1b); the choice is kept in the cached message. */
export function useMessageFeedback(notebookId: string) {
  const queryClient = useQueryClient()
  return useMutation<unknown, unknown, { messageId: string } & NotebookFeedbackBody>({
    mutationFn: ({ messageId, ...body }) => postNotebookFeedback(notebookId, messageId, body),
    onMutate: ({ messageId, rating }) => {
      queryClient.setQueryData<NotebookChatHistory>(keys.notebooks.chat(notebookId), (current) =>
        current
          ? { messages: current.messages.map((m) => (m.id === messageId ? { ...m, feedback: rating } : m)) }
          : current,
      )
    },
    onError: () => void queryClient.invalidateQueries({ queryKey: keys.notebooks.chat(notebookId) }),
  })
}

/** "Save to note": the answer becomes a `note` source (selected, so later answers can use it). */
export function useSaveToNote(notebookId: string) {
  const queryClient = useQueryClient()
  return useMutation<SourceItem, unknown, { messageId: string; title?: string }>({
    mutationFn: ({ messageId, title }) => postSaveNote(notebookId, messageId, title ? { title } : undefined),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.notebooks.sources(notebookId) })
      void queryClient.invalidateQueries({ queryKey: keys.notebooks.detail(notebookId) })
    },
  })
}
