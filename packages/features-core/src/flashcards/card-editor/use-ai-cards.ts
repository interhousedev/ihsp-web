"use client"

import {
  getArtifact,
  getNotebookSources,
  postArtifact,
  postFlashcardWorkspace,
  type FlashcardsContent,
} from "@ihsp/api"
import { useCallback, useEffect, useRef, useState } from "react"
import { hasPendingSources, isUsable } from "../../notebooks/lib/sort-sources"
import type { ImportedCard } from "../utils/parse-import"

const POLL_MS = 2000
const MAX_POLLS = 450 // 15 minutes

export type AiCardsRequest = {
  notebookSources: { notebook_id: string; source_id: string }[]
  fileIds: string[]
  count: "fewer" | "standard" | "more"
  prompt: string
}

export type AiCardsPhase = "idle" | "reading" | "generating" | "preview" | "failed"

class GenerationFailed extends Error {}

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal.addEventListener("abort", () => {
      clearTimeout(timer)
      reject(signal.reason)
    })
  })
}

/** Polls until `read` gives a value, or fails after 15 minutes. */
async function poll<T>(read: () => Promise<T | null>, signal: AbortSignal): Promise<T> {
  for (let attempt = 0; attempt < MAX_POLLS; attempt += 1) {
    const value = await read()
    if (value !== null) return value
    await wait(POLL_MS, signal)
  }
  throw new GenerationFailed()
}

/**
 * Runs Studio for a card set: the chosen sources go to the hidden notebook, are read to the end, and the usual flash
 * cards output is generated from them. Limits and quotas are those of Studio.
 */
export function useAiCards() {
  const [phase, setPhase] = useState<AiCardsPhase>("idle")
  const [cards, setCards] = useState<ImportedCard[]>([])
  const [error, setError] = useState<unknown>(null)
  const running = useRef<AbortController | null>(null)

  const reset = useCallback(() => {
    running.current?.abort()
    running.current = null
    setPhase("idle")
    setCards([])
    setError(null)
  }, [])

  useEffect(() => () => running.current?.abort(), [])

  async function start(request: AiCardsRequest) {
    running.current?.abort()
    const control = new AbortController()
    running.current = control
    const { signal } = control
    setError(null)
    setPhase("reading")
    try {
      const workspace = await postFlashcardWorkspace({
        notebook_sources: request.notebookSources,
        file_ids: request.fileIds,
      })
      const id = workspace.notebook_id
      const sources = await poll(async () => {
        const rows = await getNotebookSources(id)
        return hasPendingSources(rows) ? null : rows
      }, signal)
      const usable = sources.filter(isUsable).map((source) => source.id)
      if (usable.length === 0) throw new GenerationFailed()
      setPhase("generating")
      const prompt = request.prompt.trim()
      const artifact = await postArtifact(id, {
        kind: "flashcards",
        options: { count: request.count, source_ids: usable },
        ...(prompt ? { prompt } : {}),
      })
      const detail = await poll(async () => {
        const row = await getArtifact(id, artifact.id)
        if (row.status === "failed" || row.status === "canceled") throw new GenerationFailed()
        return row.status === "ready" ? row : null
      }, signal)
      if (signal.aborted) return
      const content = detail.content as FlashcardsContent
      setCards(content.cards.map(({ front, back }) => ({ front, back })))
      setPhase("preview")
    } catch (caught) {
      if (signal.aborted) return
      setError(caught instanceof GenerationFailed ? null : caught)
      setPhase("failed")
    }
  }

  return { phase, cards, error, start, reset }
}
