// Server-sent events over `fetch`: the notebook chat streams its answer.

import type { AiStreamEvent } from "./types/ai"
import type { NotebookStreamDone, NotebookStreamEvent } from "./types/notebooks"

export type RawSseEvent = { event: string; data: string }

/** Splits a text stream into SSE events (`event:` and `data:` fields, blank line between events). */
export async function* readSse(body: ReadableStream<Uint8Array>): AsyncGenerator<RawSseEvent> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  try {
    for (;;) {
      const { done, value } = await reader.read()
      buffer += decoder.decode(value, { stream: !done })
      let boundary = nextBoundary(buffer)
      while (boundary) {
        const raw = buffer.slice(0, boundary.index)
        buffer = buffer.slice(boundary.index + boundary.length)
        const parsed = parseBlock(raw)
        if (parsed) yield parsed
        boundary = nextBoundary(buffer)
      }
      if (done) break
    }
    const rest = parseBlock(buffer)
    if (rest) yield rest
  } finally {
    reader.releaseLock()
  }
}

function nextBoundary(buffer: string): { index: number; length: number } | null {
  const match = /\r?\n\r?\n/.exec(buffer)
  return match ? { index: match.index, length: match[0].length } : null
}

function parseBlock(block: string): RawSseEvent | null {
  let event = "message"
  const data: string[] = []
  for (const line of block.split(/\r?\n/)) {
    if (!line || line.startsWith(":")) continue
    const colon = line.indexOf(":")
    const field = colon === -1 ? line : line.slice(0, colon)
    const value = colon === -1 ? "" : line.slice(colon + 1).replace(/^ /, "")
    if (field === "event") event = value
    else if (field === "data") data.push(value)
  }
  return data.length > 0 ? { event, data: data.join("\n") } : null
}

const KNOWN_EVENTS = new Set(["message", "delta", "citation", "web", "step", "done", "error"])

/** Turns the raw events of a notebook answer into typed ones; unknown events and invalid JSON are skipped. */
export async function* readNotebookStream(response: Response): AsyncGenerator<NotebookStreamEvent> {
  if (!response.body) return
  for await (const raw of readSse(response.body)) {
    if (!KNOWN_EVENTS.has(raw.event)) continue
    try {
      yield { event: raw.event, data: normalizeData(raw.event, JSON.parse(raw.data)) } as NotebookStreamEvent
    } catch {
      continue
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/** `done` carries the stored assistant message, either wrapped (`assistant_message`) or bare. */
function normalizeData(event: string, data: unknown): unknown {
  if (event !== "done" || !isRecord(data)) return data
  if ("assistant_message" in data) return data
  const { usage, action, user_message, ...message } = data
  const done: NotebookStreamDone = { assistant_message: message as NotebookStreamDone["assistant_message"] }
  if (usage) done.usage = usage as NotebookStreamDone["usage"]
  if (action) done.action = action as NotebookStreamDone["action"]
  if (user_message) done.user_message = user_message as NotebookStreamDone["user_message"]
  return done
}

const AI_EVENTS = new Set(["status", "step", "delta", "round_end", "done", "error"])

/** Turns the raw events of an assistant chat answer into typed ones; unknown events and invalid JSON are skipped. */
export async function* readAiChatStream(response: Response): AsyncGenerator<AiStreamEvent> {
  if (!response.body) return
  for await (const raw of readSse(response.body)) {
    if (!AI_EVENTS.has(raw.event)) continue
    try {
      yield { event: raw.event, data: JSON.parse(raw.data) } as AiStreamEvent
    } catch {
      continue
    }
  }
}
