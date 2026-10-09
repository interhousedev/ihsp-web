"use client"

import type { ChatDetail, ChatMessageView } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { useMemo } from "react"
import { AssistantMessage } from "./assistant-message"
import { hiddenCallsPerMessage } from "./hidden-calls"
import type { Rating } from "./message-actions"
import { ThinkingIndicator } from "./thinking-indicator"
import type { ChatActions } from "./use-chat-actions"
import { UserMessage } from "./user-message"

export type PendingMessage = { text: string; fileIds: string[] }

type ChatMessageListProps = {
  chat: ChatDetail
  ratings: Readonly<Record<number, Rating>>
  /** The student's message while its answer is on the way. */
  pending: PendingMessage | null
  /** A turn (send, approve, reject, regenerate) is running. */
  busy: boolean
  /** The answer with this `seq` is being replaced and is hidden meanwhile. */
  regeneratingSeq: number | null
  limitReachedTurn: boolean
  actions: Pick<ChatActions, "shareChat">
  onApprove: (callId: string) => void
  onReject: (callId: string, reason: string | undefined) => void
  onRate: (seq: number, rating: Rating) => void
  onRegenerate: () => void
}

/** The conversation as a centred column: bubbles for the student, plain Markdown with actions for the assistant. */
export function ChatMessageList({
  chat,
  ratings,
  pending,
  busy,
  regeneratingSeq,
  limitReachedTurn,
  actions,
  onApprove,
  onReject,
  onRate,
  onRegenerate,
}: ChatMessageListProps) {
  const t = useT("assistant.chat")
  const { messages } = chat
  const hidden = useMemo(() => hiddenCallsPerMessage(messages), [messages])

  const pendingView: ChatMessageView | null = pending
    ? { seq: -1, role: "user", text: pending.text, file_ids: pending.fileIds, tool_calls: [], created_at: "", web: [], feedback: null }
    : null

  return (
    <div
      role="log"
      aria-live="polite"
      aria-label={t("messages")}
      className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6"
    >
      {messages.length === 0 && pending === null ? (
        <p className="text-muted-foreground m-auto max-w-sm py-10 text-center text-sm">{t("emptyChat")}</p>
      ) : null}
      {messages.map((message, index) => {
        if (message.role === "user") return <UserMessage key={message.seq} message={message} />
        if (message.seq === regeneratingSeq) return null
        return (
          <AssistantMessage
            key={message.seq}
            chat={chat}
            message={message}
            isLast={index === messages.length - 1}
            hiddenCallIds={hidden[index] ?? new Set()}
            rating={ratings[message.seq]}
            busy={busy}
            actions={actions}
            onApprove={onApprove}
            onReject={onReject}
            onRate={onRate}
            onRegenerate={onRegenerate}
          />
        )
      })}
      {pendingView ? (
        <div data-testid="pending-message">
          <UserMessage message={pendingView} />
        </div>
      ) : null}
      {busy ? <ThinkingIndicator /> : null}
      {limitReachedTurn ? (
        <p role="status" className="text-muted-foreground text-sm">
          {t("limitReachedTurn")}
        </p>
      ) : null}
    </div>
  )
}
