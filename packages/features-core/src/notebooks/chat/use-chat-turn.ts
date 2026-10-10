"use client"

import {
  ApiError,
  keys,
  networkError,
  readNotebookStream,
  streamNotebookMessage,
  streamNotebookRegenerate,
  type Anchor,
  type ArtifactCreate,
  type Citation,
  type NotebookChatHistory,
  type NotebookMessage,
  type NotebookMessageBody,
  type NotebookStreamEvent,
  type NotebookTurn,
  type NotebookUsage,
  type WebResult,
} from "@ihsp/api"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useRef, useState } from "react"
import { webSearchFailure, type WebSearchFailure } from "../../web-search"
import { parseSlashText } from "../../assistant-chat/slash-commands"
import { storeNotebookTurn } from "../api"
import { abortable } from "./abortable"
import { answerIsStored, lastSeq, optimisticUserMessage, questionIsPending, type PendingTurn } from "./pending-turn"

/** How often the growing answer is painted: a long answer is many small `delta` events, not many renders. */
const FLUSH_MS = 50

export type SendOptions = {
  /** Passages or text the question is about. */
  anchor?: Anchor
  /** Restrict the answer to these sources; default is the current selection. */
  sourceIds?: string[]
  /** Let the model search the web too (`web_search: true`); the answer then carries web pages. */
  webSearch?: boolean
}

/** A Studio output the assistant proposed in its answer (P2): shown as an action card under that answer. */
export type ProposedAction = { messageId: string; create: ArtifactCreate }

/** The question text of a failed turn, to put back into the composer (`id` changes with every failure). */
export type RestoredDraft = { id: number; text: string }

export type ChatTurn = {
  /** True from the click on Send until the stored answer (or the stop) is in place. */
  running: boolean
  /** The question and the growing answer that are not in the history yet. */
  pending: PendingTurn | null
  /** The last failure of a turn (a problem from the server, a stream `error` event or the network). */
  error: unknown
  restore: RestoredDraft | null
  /**
   * Why the last question sent with the web switch on was refused (it never reached the notebook, so its text is in
   * `restore`); `null` after the next turn starts.
   */
  webFailure: WebSearchFailure | null
  action: ProposedAction | null
  send: (text: string, options?: SendOptions) => Promise<void>
  /** Sends the question of the last `webFailure` again with the web switch off. */
  sendWithoutWeb: () => Promise<void>
  regenerate: () => Promise<void>
  stop: () => void
  dismissAction: () => void
}

type TurnRequest = { kind: "send"; text: string; options: SendOptions } | { kind: "regenerate" }

function isEventStream(response: Response): boolean {
  return (response.headers.get("content-type") ?? "").includes("text/event-stream")
}

function errorFromEvent(data: Extract<NotebookStreamEvent, { event: "error" }>["data"]): ApiError {
  return new ApiError({
    type: data.type ?? "ai/provider-error",
    status: 0,
    title: data.title ?? "",
    message_key: data.message_key ?? null,
    params: data.params,
  })
}

/** Lets the query observers publish a cache write before the pending turn is cleared (no flicker). */
const nextTask = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

/**
 * One question or regeneration at a time, streamed (P1b): the student's question shows at once, deltas are collected
 * and painted every 50 ms, citations arrive as their markers do, and the final event is stored in the chat history.
 * `stop` aborts the request and keeps the partial text. A server that answers with JSON instead of a stream still works.
 */
export function useChatTurn(notebookId: string): ChatTurn {
  const queryClient = useQueryClient()
  const [pending, setPending] = useState<PendingTurn | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [restore, setRestore] = useState<RestoredDraft | null>(null)
  const [action, setAction] = useState<ProposedAction | null>(null)
  const [webFailure, setWebFailure] = useState<WebSearchFailure | null>(null)
  const failedWebRequest = useRef<Extract<TurnRequest, { kind: "send" }> | null>(null)
  const runningRef = useRef(false)
  const controllerRef = useRef<AbortController | null>(null)
  const restoreCount = useRef(0)
  const turnCount = useRef(0)

  const run = useCallback(
    async (request: TurnRequest): Promise<void> => {
      if (runningRef.current) return
      runningRef.current = true
      setRunning(true)
      setError(null)
      setAction(null)
      setWebFailure(null)
      failedWebRequest.current = null
      const usedWeb = request.kind === "send" && request.options.webSearch === true

      const chatKey = keys.notebooks.chat(notebookId)
      const messages = queryClient.getQueryData<NotebookChatHistory>(chatKey)?.messages ?? []
      const last = messages.at(-1)
      turnCount.current += 1
      const turn: PendingTurn = {
        id: turnCount.current,
        kind: request.kind,
        userText: request.kind === "send" ? request.text : null,
        assistantText: "",
        citations: [],
        web: [],
        stopped: false,
        baselineSeq: lastSeq(messages),
        replaced: request.kind === "regenerate" && last?.role === "assistant" ? { id: last.id, seq: last.seq } : null,
      }
      const controller = new AbortController()
      controllerRef.current = controller
      setPending(turn)

      const buffer = { text: "", citations: [] as Citation[], web: [] as WebResult[] }
      let timer: ReturnType<typeof setTimeout> | null = null
      const paint = () => {
        timer = null
        setPending((current) =>
          current
            ? { ...current, assistantText: buffer.text, citations: [...buffer.citations], web: buffer.web }
            : current,
        )
      }
      const schedule = () => {
        timer ??= setTimeout(paint, FLUSH_MS)
      }
      const stopTimer = () => {
        if (timer !== null) clearTimeout(timer)
        timer = null
      }

      let userMessage: { id: string; seq: number } | null = null
      const outcome = { stored: false }

      const store = (stored: NotebookMessage[], usage: NotebookUsage | undefined, proposed?: ArtifactCreate | null) => {
        storeNotebookTurn(queryClient, notebookId, stored, usage)
        if (!usage) void queryClient.invalidateQueries({ queryKey: keys.notebooks.usage() })
        const assistant = stored.find((message) => message.role === "assistant")
        if (proposed && assistant) setAction({ messageId: assistant.id, create: proposed })
        outcome.stored = true
      }

      // Clean-up that runs after an await must not remove a newer turn.
      const clearPending = () => setPending((current) => (current?.id === turn.id ? null : current))
      let released = false
      const release = () => {
        if (released) return
        released = true
        controllerRef.current = null
        runningRef.current = false
        setRunning(false)
      }

      const restoreQuestion = () => {
        if (request.kind !== "send") return
        restoreCount.current += 1
        setRestore({ id: restoreCount.current, text: request.text })
      }

      try {
        const response =
          request.kind === "send"
            ? await streamNotebookMessage(notebookId, toBody(request), { signal: controller.signal })
            : await streamNotebookRegenerate(notebookId, { signal: controller.signal })

        if (!isEventStream(response)) {
          const result = (await response.json()) as NotebookTurn
          store([result.user_message, result.assistant_message], result.usage, result.action)
        } else {
          for await (const event of abortable(readNotebookStream(response), controller.signal)) {
            if (event.event === "message") {
              userMessage = event.data
            } else if (event.event === "delta") {
              buffer.text += event.data.text
              schedule()
            } else if (event.event === "citation") {
              const citation = event.data
              if (!buffer.citations.some((item) => item.n === citation.n)) buffer.citations.push(citation)
              schedule()
            } else if (event.event === "web") {
              buffer.web = event.data.results
              schedule()
            } else if (event.event === "error") {
              throw errorFromEvent(event.data)
            } else {
              const { assistant_message: assistant, user_message: user, usage, action: proposed } = event.data
              const own =
                user ??
                (request.kind === "send" && userMessage
                  ? optimisticUserMessage(userMessage.id, userMessage.seq, request.text)
                  : null)
              store(own ? [own, assistant] : [assistant], usage, proposed)
              if (request.kind === "send" && !own) void queryClient.invalidateQueries({ queryKey: chatKey })
              break
            }
          }
          if (!outcome.stored) throw networkError(new Error("The answer stream ended early"))
        }
        stopTimer()
        await nextTask()
        clearPending()
      } catch (cause) {
        stopTimer()
        if (controller.signal.aborted) {
          // The student pressed Stop: keep the partial text; the server stores it with `stopped: true`.
          setPending((current) =>
            current
              ? { ...current, assistantText: buffer.text, citations: [...buffer.citations], stopped: true }
              : current,
          )
          release() // Send is available again while the history reloads
          await queryClient.invalidateQueries({ queryKey: chatKey })
          const after = queryClient.getQueryData<NotebookChatHistory>(chatKey)?.messages ?? []
          if (answerIsStored(after, turn) || buffer.text === "") {
            clearPending()
            if (questionIsPending(after, turn)) restoreQuestion()
          }
        } else {
          setError(cause)
          void queryClient.invalidateQueries({ queryKey: keys.notebooks.usage() })
          if (request.kind === "send" && userMessage === null) {
            restoreQuestion()
            const failure = usedWeb ? webSearchFailure(cause) : null
            if (failure) {
              failedWebRequest.current = request
              setWebFailure(failure)
            }
          } else {
            await queryClient.invalidateQueries({ queryKey: chatKey })
          }
          clearPending()
        }
      } finally {
        stopTimer()
        release()
        // A web search spends from today's quota, also when the answer failed or was stopped.
        if (usedWeb) void queryClient.invalidateQueries({ queryKey: keys.ai.webSearch() })
      }
    },
    [notebookId, queryClient],
  )

  const send = useCallback((text: string, options: SendOptions = {}) => run({ kind: "send", text, options }), [run])
  const regenerate = useCallback(() => run({ kind: "regenerate" }), [run])
  const sendWithoutWeb = useCallback(async () => {
    const failed = failedWebRequest.current
    if (!failed) return
    // The question is sent again by itself: the copy that came back into the composer must go.
    setRestore(null)
    await run({ ...failed, options: { ...failed.options, webSearch: false } })
  }, [run])
  const stop = useCallback(() => controllerRef.current?.abort(), [])
  const dismissAction = useCallback(() => setAction(null), [])

  return {
    running,
    pending,
    error,
    restore,
    webFailure,
    action,
    send,
    sendWithoutWeb,
    regenerate,
    stop,
    dismissAction,
  }
}

function toBody(request: Extract<TurnRequest, { kind: "send" }>): NotebookMessageBody {
  const { text, options } = request
  // A slash command goes to the server as {command, args}; it turns the command into the question.
  const call = parseSlashText(text)
  return {
    text: call ? "" : text,
    ...(call ? { command: call.name, args: call.args } : {}),
    ...(options.sourceIds ? { source_ids: options.sourceIds } : {}),
    ...(options.anchor ? { anchor: options.anchor } : {}),
    ...(options.webSearch ? { web_search: true } : {}),
  }
}
