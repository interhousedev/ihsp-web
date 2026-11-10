"use client"

import type { ExcuseMessage } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Icons, Message, MessageContent, MessageGroup, MessageHeader } from "@ihsp/ui"

/** The messages of an excuse: author, time, text and the attached documents. */
export function ExcuseThread({ thread }: { thread: readonly ExcuseMessage[] }) {
  const t = useT("excuses.thread")
  const f = useFormatters()
  if (thread.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>
  return (
    <MessageGroup role="list" aria-label={t("title")}>
      {thread.map((message) => (
        <Message key={message.id} role="listitem">
          <MessageContent>
            <MessageHeader className="gap-2 px-0">
              <span className="font-medium text-foreground">{message.author_name}</span>
              <time dateTime={message.created_at}>{f.dateTime(message.created_at)}</time>
            </MessageHeader>
            {message.body ? <p className="rounded-lg bg-muted px-3 py-2 whitespace-pre-wrap">{message.body}</p> : null}
            {message.attachments.map((file) => (
              <a
                key={file.file_id}
                href={file.download_url}
                target="_blank"
                rel="noreferrer"
                aria-label={t("download", { name: file.name })}
                className="flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm underline-offset-2 hover:underline md:min-h-8"
              >
                <Icons.paperclip aria-hidden className="size-4 shrink-0" />
                <span className="truncate">{file.name}</span>
              </a>
            ))}
          </MessageContent>
        </Message>
      ))}
    </MessageGroup>
  )
}
