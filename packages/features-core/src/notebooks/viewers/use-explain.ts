"use client"

import type { Anchor, NotebookMessage } from "@ihsp/api"
import { useCallback, useRef, useState } from "react"
import { useAskNotebook } from "../api/use-notebook-chat"

/** A question the "Explain" button of a card or a quiz question asks the notebook chat. */
export type ExplainRequest = {
  /** The question sent to the chat. */
  text: string
  /** The passages (or text) the question is about. */
  anchor?: Anchor | undefined
  /** What the panel shows as its subject (the card front, the question). */
  heading: string
}

export type ExplainState = {
  request: ExplainRequest | null
  status: "idle" | "loading" | "ready" | "error"
  answer: NotebookMessage | null
  error: unknown
}

export type Explain = {
  state: ExplainState
  /** Asks the chat (or reuses the answer already received for the same question) and opens the panel. */
  start: (request: ExplainRequest) => void
  retry: () => void
  close: () => void
}

const IDLE: ExplainState = { request: null, status: "idle", answer: null, error: null }

const cacheKey = (request: ExplainRequest) => JSON.stringify([request.text, request.anchor ?? null])

/**
 * State of an Explain panel: one grounded question at a time through `useAskNotebook` (the answer also joins the
 * notebook chat). Answers are kept while the viewer is open, so reopening the same card costs nothing.
 */
export function useExplain(notebookId: string): Explain {
  const { mutate } = useAskNotebook(notebookId)
  const [state, setState] = useState<ExplainState>(IDLE)
  const answers = useRef(new Map<string, NotebookMessage>())
  const active = useRef<string | null>(null)

  const start = useCallback(
    (request: ExplainRequest) => {
      const key = cacheKey(request)
      active.current = key
      const cached = answers.current.get(key)
      if (cached) {
        setState({ request, status: "ready", answer: cached, error: null })
        return
      }
      setState({ request, status: "loading", answer: null, error: null })
      mutate(
        { text: request.text, ...(request.anchor ? { anchor: request.anchor } : {}) },
        {
          onSuccess: (turn) => {
            answers.current.set(key, turn.assistant_message)
            if (active.current === key) {
              setState({ request, status: "ready", answer: turn.assistant_message, error: null })
            }
          },
          onError: (error) => {
            if (active.current === key) setState({ request, status: "error", answer: null, error })
          },
        },
      )
    },
    [mutate],
  )

  const retry = useCallback(() => {
    if (state.request) start(state.request)
  }, [start, state.request])

  const close = useCallback(() => {
    active.current = null
    setState(IDLE)
  }, [])

  return { state, start, retry, close }
}
