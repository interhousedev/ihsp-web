"use client"

import type { ExcuseMessage } from "@ihsp/api"
import { useT, formatDateTime } from "@ihsp/i18n"
import { FeedbackAttachmentList } from "../../feedback/components/feedback-attachment"

/** The conversation of an excuse: the lines of the student and the curators, with their files. */
export function ExcuseThread({ messages, ownerId }: { messages: readonly ExcuseMessage[]; ownerId: string }) {
  const t = useT("excuses")
  if (messages.length === 0) return <p className="text-muted-foreground text-sm">{t("thread.empty")}</p>
  return (
    <ul aria-label={t("thread.title")} className="flex flex-col gap-3">
      {messages.map((message) => (
        <li
          key={message.id}
          data-own={message.author_id === ownerId}
          className="bg-muted flex flex-col gap-2 rounded-lg p-3 data-[own=true]:bg-secondary"
        >
          <p className="text-muted-foreground text-xs">
            {message.author_name} · {formatDateTime(message.created_at)}
          </p>
          {message.body ? <p className="text-sm whitespace-pre-line break-words">{message.body}</p> : null}
          <FeedbackAttachmentList attachments={message.attachments} />
        </li>
      ))}
    </ul>
  )
}
