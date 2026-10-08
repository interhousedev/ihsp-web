"use client"

import type { ChatMessageView, ToolCallView as ToolCall } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Markdown } from "@ihsp/ui"
import { FileChip } from "./file-chip"
import { ToolCallView } from "./tool-call-view"

type ChatMessageProps = {
  message: ChatMessageView
  /** Tool calls already shown by an earlier message (an approved call appears again in the follow-up). */
  hiddenCallIds: ReadonlySet<string>
  busy: boolean
  onApprove: (callId: string) => void
  onReject: (callId: string, reason: string | undefined) => void
}

/** One message: the user's text as plain text, the assistant's as safe Markdown with its tool calls above. */
export function ChatMessage({ message, hiddenCallIds, busy, onApprove, onReject }: ChatMessageProps) {
  const t = useT("assistant.message")
  const isUser = message.role === "user"
  const calls: ToolCall[] = message.tool_calls.filter((call) => !hiddenCallIds.has(call.id))

  return (
    <article
      aria-label={isUser ? t("you") : t("assistant")}
      data-role={message.role}
      className={`flex min-w-0 flex-col gap-2 ${isUser ? "items-end" : "items-start"}`}
    >
      {calls.length > 0 ? (
        <div className="flex w-full max-w-[min(100%,42rem)] flex-col gap-2">
          {calls.map((call) => (
            <ToolCallView key={call.id} call={call} busy={busy} onApprove={onApprove} onReject={onReject} />
          ))}
        </div>
      ) : null}
      {message.text ? (
        <div
          className={
            isUser
              ? "bg-primary text-primary-foreground max-w-[min(100%,36rem)] rounded-2xl rounded-br-sm px-3 py-2 text-sm whitespace-pre-wrap break-words"
              : "bg-muted max-w-[min(100%,42rem)] rounded-2xl rounded-bl-sm px-3 py-2 text-sm break-words"
          }
        >
          {isUser ? message.text : <Markdown>{message.text}</Markdown>}
        </div>
      ) : null}
      {message.file_ids.length > 0 ? (
        <div className="flex max-w-full flex-wrap justify-end gap-1">
          {message.file_ids.map((id) => (
            <FileChip key={id} fileId={id} />
          ))}
        </div>
      ) : null}
    </article>
  )
}
