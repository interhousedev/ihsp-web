"use client"

import type { NotebookDetail, NotebookMessage as Message } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, StateView, useOnline } from "@ihsp/ui"
import { IconArrowDown } from "@ihsp/ui"
import { useCallback, useEffect, useRef } from "react"
import { useWebSearchErrorMessage } from "../../web-search"
import { notebookLimit, useNotebookChat, useNotebookUsage } from "../api"
import { useNotebookErrorMessage } from "../lib"
import type { AskRequest } from "../types"
import { NotebookComposer, type ComposerSendOptions } from "./notebook-composer"
import { NotebookMessage } from "./notebook-message"
import { NotebookTopBlock } from "./notebook-top-block"
import { answerIsStored, questionIsPending } from "./pending-turn"
import { StreamingAnswer } from "./streaming-answer"
import { useChatTurn, type SendOptions } from "./use-chat-turn"
import { useStickToBottom } from "./use-stick-to-bottom"
import { useWebSwitch } from "./use-web-switch"
import { UserMessageBubble } from "./user-message-bubble"

export type NotebookChatProps = {
  notebook: NotebookDetail
  /** A question another pane asked (source topic chip, mind map node); the chat sends it once and calls `onAskHandled`. */
  pendingAsk: AskRequest | null
  onAskHandled: () => void
}

const NO_MESSAGES: Message[] = []

/**
 * The cited chat panel: the top block (title, summary, suggested questions),
 * the saved conversation with the answer that is being written, quick actions under the latest answer and the
 * composer. Answers stream in; Stop keeps the partial text.
 */
export function NotebookChat({ notebook, pendingAsk, onAskHandled }: NotebookChatProps) {
  const t = useT("notebooks.chat")
  const tm = useT("assistant.message")
  const errorMessage = useNotebookErrorMessage()
  const webErrorMessage = useWebSearchErrorMessage()
  const chat = useNotebookChat(notebook.id)
  const usage = useNotebookUsage(notebook.id)
  const online = useOnline()
  const turn = useChatTurn(notebook.id)
  const { send, sendWithoutWeb, regenerate, stop, dismissAction, running, pending } = turn
  const [web, setWeb] = useWebSwitch(notebook.id)

  const limit = notebookLimit(usage.data)
  const canAsk = online && !limit.reached && !running && notebook.can_write !== false

  const saved = chat.data?.messages ?? NO_MESSAGES
  const visible = pending?.replaced ? saved.filter((message) => message.id !== pending.replaced?.id) : saved
  const showQuestion = pending !== null && questionIsPending(saved, pending)
  const showAnswer = pending !== null && !answerIsStored(saved, pending)
  const latestAnswer = showAnswer ? undefined : visible.findLast((message) => message.role === "assistant")
  const latestIsLast = latestAnswer !== undefined && visible.at(-1)?.id === latestAnswer.id

  const { ref: scrollRef, onScroll, atBottom, scrollToEnd } = useStickToBottom()
  const ask = useCallback(
    (text: string, options?: SendOptions) => {
      void send(text, options)
    },
    [send],
  )

  // A question the web search refused comes back into the composer with the switch off.
  useEffect(() => {
    if (turn.webFailure !== null) setWeb(false)
  }, [turn.webFailure, setWeb])

  const sendFromComposer = useCallback(
    (text: string, options: ComposerSendOptions) => {
      void send(text, options)
    },
    [send],
  )

  // A question from another pane is sent once (also under StrictMode) and then reported as handled.
  const handledAsk = useRef<AskRequest | null>(null)
  useEffect(() => {
    if (!pendingAsk || handledAsk.current === pendingAsk || running) return
    handledAsk.current = pendingAsk
    ask(pendingAsk.text, { anchor: pendingAsk.anchor, sourceIds: pendingAsk.sourceIds })
    onAskHandled()
  }, [pendingAsk, running, ask, onAskHandled])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="relative min-h-0 flex-1">
        <div ref={scrollRef} onScroll={onScroll} className="absolute inset-0 overflow-y-auto">
          <div
            role="log"
            aria-live="polite"
            aria-label={t("messages")}
            aria-busy={running}
            className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-3 py-4 md:px-6"
          >
            <NotebookTopBlock notebook={notebook} askDisabled={!canAsk} onAsk={ask} />
            {chat.isPending ? <StateView state="loading" rows={2} /> : null}
            {chat.isError ? <StateView state="error" error={chat.error} onRetry={() => void chat.refetch()} /> : null}
            {visible.map((message) => (
              <NotebookMessage
                key={message.id}
                notebookId={notebook.id}
                message={message}
                latest={message.id === latestAnswer?.id && latestIsLast}
                canAsk={canAsk}
                action={turn.action}
                onAsk={ask}
                onRegenerate={() => void regenerate()}
                onDismissAction={dismissAction}
              />
            ))}
            {pending && showQuestion && pending.userText !== null ? (
              <div data-role="user" data-pending className="flex min-w-0 justify-end">
                <UserMessageBubble text={pending.userText} />
              </div>
            ) : null}
            {pending && showAnswer ? <StreamingAnswer pending={pending} running={running} /> : null}
            {turn.error ? (
              <div className="flex flex-col items-start gap-2">
                <p role="alert" className="text-destructive text-sm">
                  {webErrorMessage(turn.error) ?? errorMessage(turn.error)}
                </p>
                {turn.webFailure === "quota-exceeded" || turn.webFailure === "unavailable" ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11"
                    disabled={!canAsk}
                    onClick={() => void sendWithoutWeb()}
                  >
                    {tm("sendWithoutWeb")}
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
        {!atBottom ? (
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute end-4 bottom-3 size-11 rounded-full shadow-md"
            aria-label={tm("scrollDown")}
            onClick={scrollToEnd}
          >
            <IconArrowDown aria-hidden />
          </Button>
        ) : null}
      </div>
      <div className="bg-background shrink-0 px-3 pt-2 pb-3 md:px-6">
        <div className="mx-auto w-full max-w-3xl">
          <NotebookComposer
            notebook={notebook}
            limit={limit}
            running={running}
            restore={turn.restore}
            web={web}
            onWebChange={setWeb}
            onSend={sendFromComposer}
            onStop={stop}
          />
        </div>
      </div>
    </div>
  )
}
