"use client"

import type { ChatItem, ChatMessageView, ToolCallView as ToolCall } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Markdown } from "@ihsp/ui"
import { IconSparkles } from "@ihsp/ui"
import { StepTrace } from "../agent-steps/step-trace"
import { WebSourcesRow } from "../notebooks/chat/web-sources-row"
import { MessageActions, type Rating } from "./message-actions"
import { ToolCallView } from "./tool-call-view"
import type { ChatActions } from "./use-chat-actions"
import { useWebRenderText } from "./use-web-render-text"
import { MessageWithOpenUi, chatLibrary } from "../openui"

type AssistantMessageProps = {
  chat: ChatItem
  message: ChatMessageView
  isLast: boolean
  /** Tool calls already shown by an earlier message (an approved call appears again in the follow-up). */
  hiddenCallIds: ReadonlySet<string>
  rating: Rating | undefined
  busy: boolean
  actions: Pick<ChatActions, "shareChat">
  onApprove: (callId: string) => void
  onReject: (callId: string, reason: string | undefined) => void
  onRate: (seq: number, rating: Rating) => void
  onRegenerate: () => void
}

/** The assistant's answer: no bubble, full column width, a small sparkle above, tool calls above the text. */
export function AssistantMessage({
  chat,
  message,
  isLast,
  hiddenCallIds,
  rating,
  busy,
  actions,
  onApprove,
  onReject,
  onRate,
  onRegenerate,
}: AssistantMessageProps) {
  const t = useT("assistant.message")
  const calls: ToolCall[] = visibleCalls(message, hiddenCallIds)
  const text = answerText(message)
  const renderText = useWebRenderText(message.web)

  return (
    <article
      aria-label={t("assistant")}
      data-role="assistant"
      className="group/message flex min-w-0 flex-col items-start gap-2"
    >
      <span className="bg-primary/10 text-primary flex size-7 items-center justify-center rounded-full" aria-hidden>
        <IconSparkles className="size-4" />
      </span>
      <StepTrace steps={message.steps} />
      {calls.length > 0 ? (
        <div className="flex w-full flex-col gap-2">
          {calls.map((call) => (
            <ToolCallView key={call.id} call={call} busy={busy} onApprove={onApprove} onReject={onReject} />
          ))}
        </div>
      ) : null}
      {text ? (
        <>
          <MessageWithOpenUi
            text={text}
            library={chatLibrary}
            renderMarkdown={(part) => (
              <Markdown renderText={renderText} className="w-full text-base leading-7 md:text-[0.95rem]">
                {part}
              </Markdown>
            )}
          />
          <WebSourcesRow web={message.web} text={text} />
          <MessageActions
            chat={chat}
            message={message}
            isLast={isLast}
            rating={rating}
            busy={busy}
            actions={actions}
            onRate={onRate}
            onRegenerate={onRegenerate}
          />
        </>
      ) : null}
    </article>
  )
}

/**
 * The calls shown above the answer. When the answer has steps, read calls are already rows of the collapsed
 * "N steps" line, so only cards (approvals, documents) remain; older answers without steps keep their notes.
 */
export function visibleCalls(message: ChatMessageView, hidden: ReadonlySet<string>): ToolCall[] {
  const stepped = (message.steps ?? []).length > 0
  return message.tool_calls.filter(
    (call) => !hidden.has(call.id) && !(stepped && call.access === "read" && !call.document),
  )
}

/**
 * The answer text, or "" while a write waits for approval: the text of that round is a progress note
 * ("First I'll check…"), shown among the steps, never as the answer.
 */
export function answerText(message: ChatMessageView): string {
  if (message.tool_calls.some((call) => call.status === "pending_approval")) return ""
  return message.text
}
