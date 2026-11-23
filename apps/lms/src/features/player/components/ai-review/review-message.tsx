"use client"

import type { AiReviewMessage } from "@ihsp/api"
import { MessageWithOpenUi, chatLibrary } from "@ihsp/features-core/openui"
import { useT } from "@ihsp/i18n"
import { Icons, Markdown, Spinner, cn } from "@ihsp/ui"
import { messageSource } from "../../utils/ai-review"

function renderMarkdown(text: string) {
  return <Markdown className="text-sm">{text}</Markdown>
}

/** A message of the review chat: the student's text with its files, or the reviewer's text and OpenUI blocks. */
export function ReviewMessage({
  message,
}: {
  message: Pick<AiReviewMessage, "role" | "text" | "openui" | "attachments" | "kind">
}) {
  const t = useT("player")
  const mine = message.role === "student"
  const source = messageSource(message)
  return (
    <li className={cn("flex", mine ? "justify-end" : "justify-start")} data-message-kind={message.kind}>
      <div
        className={cn(
          "flex max-w-full min-w-0 flex-col gap-2 rounded-lg px-3 py-2 sm:max-w-[85%]",
          mine ? "bg-primary/10" : "bg-muted/50 border",
        )}
      >
        {!mine && message.kind === "question" ? (
          <span className="text-muted-foreground flex items-center gap-1 text-xs font-medium">
            <Icons.help aria-hidden className="size-3.5" />
            {t("aiReview.question")}
          </span>
        ) : null}
        {source ? (
          mine ? (
            <p className="text-sm break-words whitespace-pre-wrap">{source}</p>
          ) : (
            <div className="min-w-0 break-words">
              <MessageWithOpenUi text={source} library={chatLibrary} renderMarkdown={renderMarkdown} />
            </div>
          )
        ) : null}
        {message.attachments.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5" aria-label={t("aiReview.attached")}>
            {message.attachments.map((file) => (
              <li
                key={file.file_id}
                className="bg-background flex max-w-full items-center gap-1 rounded border px-2 py-1 text-xs"
              >
                <Icons.paperclip aria-hidden className="size-3 shrink-0" />
                <span className="truncate">{file.name}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </li>
  )
}

/** The reviewer is reading the work: a quiet status line in the thread. */
export function ThinkingMessage({ reviewing }: { reviewing: boolean }) {
  const t = useT("player")
  return (
    <li className="flex justify-start" role="status" aria-live="polite">
      <div className="bg-muted/50 text-muted-foreground flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
        <Spinner aria-hidden />
        {t(reviewing ? "aiReview.reviewing" : "aiReview.thinking")}
      </div>
    </li>
  )
}

/** The final review, shown above the thread. */
export function FinalReview({ message }: { message: Pick<AiReviewMessage, "text" | "openui"> }) {
  const t = useT("player")
  return (
    <section
      aria-labelledby="ai-review-final"
      className="border-primary/40 bg-primary/5 flex flex-col gap-2 rounded-lg border-2 p-4"
      data-final-review
    >
      <h3 id="ai-review-final" className="flex items-center gap-2 text-base font-semibold">
        <Icons.badgeCheck aria-hidden className="text-primary size-5" />
        {t("aiReview.finalReview")}
      </h3>
      <div className="min-w-0 break-words">
        <MessageWithOpenUi text={messageSource(message)} library={chatLibrary} renderMarkdown={renderMarkdown} />
      </div>
    </section>
  )
}
