import type { AgentStep, Citation, NotebookMessage, WebResult } from "@ihsp/api"

/**
 * The turn that is running (or was stopped) and is not in the saved history yet: the optimistic question and the
 * growing answer. It disappears from the screen as soon as the history contains the stored messages.
 */
export type PendingTurn = {
  /** Tells this turn from the next one, so a late clean-up of a stopped turn cannot remove its successor. */
  id: number
  kind: "send" | "regenerate"
  /** The question shown at once; `null` when regenerating (the question is already in the history). */
  userText: string | null
  assistantText: string
  /** Citations that arrived so far, so chips appear while their markers stream in. */
  citations: Citation[]
  /** Web pages of the answer (the `web` event), so web chips resolve while their markers stream in. */
  web: WebResult[]
  /** Steps of the answer so far (the `step` events, AI-STEPS); optional so older callers need not set it. */
  steps?: AgentStep[]
  /** The answer was stopped by the student; the partial text stays. */
  stopped: boolean
  /** Highest `seq` of the history when the turn began. */
  baselineSeq: number
  /** Regenerate: the answer that is being replaced (hidden while the new one streams). */
  replaced: { id: string; seq: number } | null
}

/** Highest message `seq` of a history, 0 when it is empty. */
export function lastSeq(messages: readonly NotebookMessage[]): number {
  return messages.reduce((max, message) => Math.max(max, message.seq), 0)
}

/** Whether the history already holds the answer of the turn (then the pending answer must not show twice). */
export function answerIsStored(messages: readonly NotebookMessage[], pending: PendingTurn): boolean {
  if (pending.replaced) {
    const { id, seq } = pending.replaced
    return messages.some((message) => message.role === "assistant" && message.seq === seq && message.id !== id)
  }
  return messages.some((message) => message.role === "assistant" && message.seq > pending.baselineSeq)
}

/** Whether the optimistic question still needs to be drawn (the history may already hold the stored one). */
export function questionIsPending(messages: readonly NotebookMessage[], pending: PendingTurn): boolean {
  if (pending.userText === null) return false
  return !messages.some((message) => message.role === "user" && message.seq > pending.baselineSeq)
}

/** The user message to cache when the final event carries only the answer: the optimistic question with the server id. */
export function optimisticUserMessage(id: string, seq: number, text: string): NotebookMessage {
  return {
    id,
    seq,
    role: "user",
    text,
    citations: [],
    followups: [],
    source_ids: [],
    web: [],
    retrieval: false,
    grounded: false,
    feedback: null,
    stopped: false,
    created_at: new Date().toISOString(),
  }
}
