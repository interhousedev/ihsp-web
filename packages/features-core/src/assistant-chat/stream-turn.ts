import {
  ApiError,
  isApiError,
  isNetworkError,
  networkError,
  postAiChatMessages,
  readAiChatStream,
  streamAiChatMessages,
  type AgentStep,
  type AiStreamEvent,
  type ChatMessageBody,
  type TurnResult,
} from "@ihsp/api"
import { upsertStep } from "../agent-steps/merge-steps"

/**
 * The answer while it is made: the status line, the steps so far and the streamed text. `note` is the progress note
 * of the last tool round: the server sends it again as a think step, so it is never echoed as the status.
 */
export type LiveAnswer = { status: string; steps: AgentStep[]; text: string; note?: string }

export const EMPTY_LIVE: LiveAnswer = { status: "", steps: [], text: "" }

/** Folds one event into the live answer (`done` and `error` end the turn and change nothing). */
export function applyLiveEvent(live: LiveAnswer, event: AiStreamEvent): LiveAnswer {
  if (event.event === "status") {
    if (live.note !== undefined && event.data.text.trim() === live.note) return live
    return { ...live, status: event.data.text }
  }
  if (event.event === "step") return { ...live, steps: upsertStep(live.steps, event.data) }
  if (event.event === "delta") return { ...live, text: live.text + event.data.text }
  if (event.event === "round_end") {
    // The streamed text of this round was a note before tool calls: the answer area empties. The note itself
    // arrives as a think step (one step per note, never two), so it stays out of the status line.
    return { status: "", steps: live.steps, text: "", note: event.data.text.trim() }
  }
  return live
}

function isEventStream(response: Response): boolean {
  return (response.headers.get("content-type") ?? "").includes("text/event-stream")
}

function errorFromEvent(data: Extract<AiStreamEvent, { event: "error" }>["data"]): ApiError {
  return new ApiError({
    type: data.type ?? "ai/provider-error",
    status: 0,
    title: data.title ?? "",
    message_key: data.message_key ?? null,
    params: data.params,
  })
}

type StreamOptions = { signal?: AbortSignal; onEvent?: (event: AiStreamEvent) => void }

/**
 * Runs a turn over SSE: `open` makes the streaming request, `onEvent` hears every status, step, delta and
 * round end, and the promise resolves with the stored result. A server that answers with JSON still works, and
 * when the stream request cannot be made at all `fallback` (the plain JSON request) is tried once.
 */
export async function streamedTurn(
  open: () => Promise<Response>,
  fallback: () => Promise<TurnResult>,
  { signal, onEvent }: StreamOptions = {},
): Promise<TurnResult> {
  let response: Response
  try {
    response = await open()
  } catch (error) {
    if (signal?.aborted || (isApiError(error) && !isNetworkError(error))) throw error
    return fallback()
  }
  if (!isEventStream(response)) return (await response.json()) as TurnResult
  for await (const event of readAiChatStream(response)) {
    if (event.event === "done") return event.data
    if (event.event === "error") throw errorFromEvent(event.data)
    onEvent?.(event)
  }
  throw networkError(new Error("The answer stream ended early"))
}

/** Sends a message with the answer streamed (see `streamedTurn`). */
export function sendStreamed(chatId: string, body: ChatMessageBody, options: StreamOptions = {}): Promise<TurnResult> {
  const opts = options.signal ? { signal: options.signal } : undefined
  return streamedTurn(
    () => streamAiChatMessages(chatId, body, opts),
    () => postAiChatMessages(chatId, body, opts),
    options,
  )
}
