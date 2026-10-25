// Test helpers of the chat panel (not exported from the package).
import { expect, mock } from "bun:test"
import type { NotebookDetail, NotebookMessage } from "@ihsp/api"
import { apiUrl, nbIds, notebookDetail, server } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import type { UserEvent } from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { StrictMode } from "react"
import { renderNotebook, type RenderNotebookOptions } from "../test-support"
import type { AskRequest } from "../types"
import { NotebookChat } from "./notebook-chat"

export const chatUrl = (path = "") => apiUrl(`/v1/notebooks/${nbIds.notebook}/chat${path}`)

export type RenderChatOptions = RenderNotebookOptions & {
  /** Wrap the panel in `StrictMode`, which runs every effect twice in development. */
  strict?: boolean
  notebook?: NotebookDetail
  pendingAsk?: AskRequest | null
  onAskHandled?: () => void
}

/**
 * The chat panel of the Photosynthesis notebook (three selected sources, one cited turn in the history), rendered once
 * its first requests (history, usage, Studio list) are done, so no update lands after the test.
 */
export async function renderChat({
  notebook,
  pendingAsk = null,
  onAskHandled,
  strict = false,
  ...options
}: RenderChatOptions = {}) {
  const handled = onAskHandled ?? mock(() => undefined)
  const panel = <NotebookChat notebook={notebook ?? notebookDetail} pendingAsk={pendingAsk} onAskHandled={handled} />
  const result = renderNotebook(strict ? <StrictMode>{panel}</StrictMode> : panel, options)
  await waitFor(() => expect(result.queryClient.isFetching()).toBe(0))
  return Object.assign(result, { onAskHandled: handled })
}

export const messageField = () => screen.getByRole("textbox", { name: "Message" })

/** Pasting is one event; typing every character makes a large tree re-render dozens of times. */
export async function enter(user: UserEvent, text: string): Promise<void> {
  await user.click(messageField())
  await user.paste(text)
}

export async function ask(user: UserEvent, text: string): Promise<void> {
  await enter(user, text)
  await user.click(screen.getByRole("button", { name: "Send" }))
}

/** Replaces the saved conversation of the notebook. */
export function seedHistory(messages: NotebookMessage[]): void {
  server.use(http.get(chatUrl(), () => HttpResponse.json({ messages })))
}

/**
 * A server-sent-event response whose events the test pushes one by one, to look at the screen between two events.
 * `install()` answers the next `POST …/chat/messages` (or `…/chat/regenerate`) with it.
 */
export function controlledStream() {
  const encoder = new TextEncoder()
  let controller: ReadableStreamDefaultController<Uint8Array> | null = null
  const body = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c
    },
  })
  return {
    install(path: "/messages" | "/regenerate" = "/messages") {
      server.use(
        http.post(chatUrl(path), () => new HttpResponse(body, { headers: { "Content-Type": "text/event-stream" } })),
      )
    },
    push(event: string, data: unknown) {
      controller?.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
    },
    close() {
      controller?.close()
    },
  }
}
