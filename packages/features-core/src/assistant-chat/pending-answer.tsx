"use client"

import { useT } from "@ihsp/i18n"
import { IconSparkles, Markdown } from "@ihsp/ui"
import { StepTrace } from "../agent-steps/step-trace"
import type { LiveAnswer } from "./stream-turn"
import { MessageWithOpenUi, chatLibrary } from "../openui"

/**
 * The one item of an answer that is being made: a small pulsing sparkle with the current status line (the latest
 * step or progress note), replaced as the work goes on; once the answer text streams, the text grows below its steps.
 */
export function PendingAnswer({ live }: { live: LiveAnswer | null }) {
  const t = useT("assistant.message")
  const status = live?.status || t("thinking")

  if (live?.text) {
    return (
      <article
        aria-label={t("assistant")}
        data-testid="pending-answer"
        className="flex min-w-0 flex-col items-start gap-2"
      >
        <span className="bg-primary/10 text-primary flex size-7 items-center justify-center rounded-full" aria-hidden>
          <IconSparkles className="size-4 animate-pulse motion-reduce:animate-none" />
        </span>
        <StepTrace steps={live.steps} />
        <MessageWithOpenUi
          text={live.text}
          isStreaming
          library={chatLibrary}
          renderMarkdown={(part) => (
            <Markdown className="w-full text-base leading-7 md:text-[0.95rem]">{part}</Markdown>
          )}
        />
      </article>
    )
  }

  return (
    <p role="status" data-testid="pending-answer" className="text-muted-foreground flex items-center gap-2 text-sm">
      <IconSparkles className="size-4 shrink-0 animate-pulse motion-reduce:animate-none" aria-hidden />
      <span className="animate-pulse motion-reduce:animate-none">{status}</span>
    </p>
  )
}
