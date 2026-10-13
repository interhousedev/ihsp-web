"use client"

import { useT } from "@ihsp/i18n"
import { IconSparkles } from "@ihsp/ui"
import { StepTrace } from "../../agent-steps/step-trace"
import { CitedMarkdown } from "./cited-markdown"
import type { PendingTurn } from "./pending-turn"

/** The answer that is being written (or was stopped): cited Markdown that grows, chips appear with their markers. */
export function StreamingAnswer({ pending, running }: { pending: PendingTurn; running: boolean }) {
  const t = useT("notebooks.chat")
  return (
    <article
      aria-label={t("assistant")}
      aria-busy={running}
      data-role="assistant"
      data-streaming={running}
      className="flex min-w-0 flex-col gap-2"
    >
      <IconSparkles className="text-primary size-5" aria-hidden />
      <StepTrace steps={pending.steps} live={running} />
      {pending.assistantText ? (
        <CitedMarkdown text={pending.assistantText} citations={pending.citations} web={pending.web} />
      ) : running ? (
        <p className="text-muted-foreground text-sm motion-safe:animate-pulse">{t("thinking")}</p>
      ) : null}
      {pending.stopped ? <p className="text-muted-foreground text-xs">{t("stopped")}</p> : null}
    </article>
  )
}
