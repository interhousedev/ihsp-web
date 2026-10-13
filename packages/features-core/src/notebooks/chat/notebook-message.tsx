"use client"

import type { NotebookMessage as Message } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { IconSparkles } from "@ihsp/ui"
import { StepTrace } from "../../agent-steps/step-trace"
import { citedNumbers, citedWebNumbers } from "../lib/citations"
import { ActionCard } from "./action-card"
import { CitedMarkdown } from "./cited-markdown"
import { FollowUpChips } from "./follow-up-chips"
import { MessageActions } from "./message-actions"
import { QuickActions } from "./quick-actions"
import type { ProposedAction } from "./use-chat-turn"
import { UserMessageBubble } from "./user-message-bubble"
import { WebSourcesRow } from "./web-sources-row"

type NotebookMessageProps = {
  notebookId: string
  message: Message
  /** The latest answer of the conversation: only it offers follow-ups, quick actions and Regenerate. */
  latest: boolean
  /** A question can be sent now (nothing runs, a source is selected, no limit, online). */
  canAsk: boolean
  /** An action card the assistant proposed under this answer (P2). */
  action: ProposedAction | null
  onAsk: (text: string) => void
  onRegenerate: () => void
  onDismissAction: () => void
}

/** One saved message: the question as a bubble, the answer as cited Markdown with its action row and chips. */
export function NotebookMessage({
  notebookId,
  message,
  latest,
  canAsk,
  action,
  onAsk,
  onRegenerate,
  onDismissAction,
}: NotebookMessageProps) {
  const t = useT("notebooks.chat")

  if (message.role === "user") {
    return (
      <article aria-label={t("you")} data-role="user" className="flex min-w-0 justify-end">
        <UserMessageBubble text={message.text} />
      </article>
    )
  }

  // Chips only appear for markers that have a citation or a page; the legend explains them when both kinds show up.
  const hasSourceChips = citedNumbers(message.text).some((n) => message.citations.some((item) => item.n === n))
  const hasWebChips = citedWebNumbers(message.text).some((n) => message.web.some((item) => item.n === n))

  return (
    <article aria-label={t("assistant")} data-role="assistant" className="flex min-w-0 flex-col gap-2">
      <IconSparkles className="text-primary size-5" aria-hidden />
      <StepTrace steps={message.steps} />
      <CitedMarkdown text={message.text} citations={message.citations} web={message.web} />
      {hasSourceChips && hasWebChips ? <p className="text-muted-foreground text-xs">{t("legend")}</p> : null}
      <WebSourcesRow web={message.web} text={message.text} />
      {message.stopped ? <p className="text-muted-foreground text-xs">{t("stopped")}</p> : null}
      {!message.grounded && message.text && !hasWebChips ? (
        <p className="text-muted-foreground text-xs">{t("noCitations")}</p>
      ) : null}
      {message.retrieval ? <p className="text-muted-foreground text-xs">{t("retrieval")}</p> : null}
      <MessageActions
        notebookId={notebookId}
        message={message}
        onRegenerate={latest && canAsk ? onRegenerate : undefined}
      />
      {latest && action?.messageId === message.id ? (
        <ActionCard notebookId={notebookId} create={action.create} onDismiss={onDismissAction} />
      ) : null}
      {latest ? <FollowUpChips followups={message.followups} disabled={!canAsk} onAsk={onAsk} /> : null}
      {latest ? <QuickActions notebookId={notebookId} disabled={!canAsk} /> : null}
    </article>
  )
}
