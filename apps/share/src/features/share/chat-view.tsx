"use client"

import type { PublicShare } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { chatLibrary, MessageWithOpenUi } from "@ihsp/features-core/openui"
import { Badge, Markdown, cn } from "@ihsp/ui"

type ChatMessages = NonNullable<PublicShare["chat"]>["messages"]

/** The conversation of a shared chat: author's messages, assistant answers and the notes of looked-up data. */
export function ChatView({ messages, authorName }: { messages: ChatMessages; authorName: string }) {
  const t = useT("share.chat")
  return (
    <div className="flex flex-col gap-4">
      <Badge variant="secondary" className="w-fit">
        {t("publicBanner")}
      </Badge>
      {messages.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">{t("empty")}</p>
      ) : (
        <ol aria-label={t("messages")} className="flex flex-col gap-4">
          {messages.map((message, index) => {
            const fromAuthor = message.role === "user"
            return (
              <li key={index} className={cn("flex flex-col gap-1", fromAuthor ? "items-end" : "items-start")}>
                <span className="text-muted-foreground text-xs font-medium">
                  {fromAuthor ? authorName : t("assistant")}
                </span>
                <div
                  className={cn(
                    "max-w-full min-w-0 rounded-2xl border px-4 py-3 text-sm break-words sm:max-w-[85%]",
                    fromAuthor ? "bg-primary text-primary-foreground border-transparent" : "bg-card",
                  )}
                >
                  {fromAuthor ? (
                    <Markdown>{message.text}</Markdown>
                  ) : (
                    <MessageWithOpenUi
                      text={message.text}
                      library={chatLibrary}
                      renderMarkdown={(part) => <Markdown>{part}</Markdown>}
                    />
                  )}
                </div>
                {message.tool_notes.length > 0 ? (
                  <ul className="text-muted-foreground flex flex-col gap-0.5 text-xs italic">
                    {message.tool_notes.map((note, noteIndex) => (
                      <li key={noteIndex}>{note}</li>
                    ))}
                  </ul>
                ) : null}
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
