import { describe, expect, it } from "bun:test"
import {
  aiTurnStream,
  apiUrl,
  chatHomework,
  problem,
  renderWithProviders,
  server,
  testRouter,
  turnResultFor,
} from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { QuickAssistant } from "./quick-assistant"

async function ask(question: string) {
  server.use(http.post(apiUrl("/v1/ai/chats"), () => HttpResponse.json(chatHomework)))
  fireEvent.click(await screen.findByRole("button", { name: "Quick AI helper" }))
  fireEvent.change(await screen.findByRole("textbox", { name: "Quick question" }), { target: { value: question } })
  fireEvent.click(screen.getByRole("button", { name: "Send" }))
}

describe("QuickAssistant", () => {
  it("streams an answer and opens the chat", async () => {
    renderWithProviders(<QuickAssistant />)
    await ask("Explain Newton's second law")
    const open = await screen.findByRole("button", { name: "Open in chat" })
    fireEvent.click(open)
    expect(testRouter.push).toHaveBeenCalled()
    const href = String(testRouter.push.mock.calls.at(-1)?.[0])
    expect(href).toMatch(/^\/assistant\/chat\/\?id=/)
  })

  it("renders an openui fence as a block, not raw code", async () => {
    server.use(
      http.post(apiUrl("/v1/ai/chats/:id/messages"), () => {
        const result = turnResultFor(chatHomework, "marks", 1)
        const answer = result.new_messages.at(-1)
        if (answer) {
          answer.text = 'Marks:\n\n```openui\nroot = Stack([StatGrid([{label: "Average", value: 4.5}])])\n```'
        }
        return aiTurnStream(result)
      }),
    )
    renderWithProviders(<QuickAssistant />)
    await ask("marks")
    expect(await screen.findByText("Average")).toBeInTheDocument()
    expect(screen.getByText("4.5")).toBeInTheDocument()
    expect(screen.queryByText(/root = /)).toBeNull()
  })

  it("closes on Escape", async () => {
    renderWithProviders(<QuickAssistant />)
    fireEvent.click(await screen.findByRole("button", { name: "Quick AI helper" }))
    const input = await screen.findByRole("textbox", { name: "Quick question" })
    fireEvent.keyDown(input, { key: "Escape" })
    await waitFor(() => expect(screen.queryByRole("textbox", { name: "Quick question" })).not.toBeInTheDocument())
  })

  it("shows the translated quota error", async () => {
    server.use(http.post(apiUrl("/v1/ai/chats/:id/messages"), () => problem(429, "ai/limit-reached", "Limit")))
    renderWithProviders(<QuickAssistant />)
    await ask("Hi")
    expect(await screen.findByRole("alert")).toBeInTheDocument()
  })

  it("is hidden when the chat AI is revoked", async () => {
    server.use(
      http.get(apiUrl("/v1/ai/usage"), () =>
        HttpResponse.json({
          session: { used: 0, limit: 1, resets_at: null },
          day: { used: 0, limit: 1, resets_at: null },
          ai_chat_blocked: true,
        }),
      ),
    )
    renderWithProviders(<QuickAssistant />)
    await Bun.sleep(100)
    expect(screen.queryByRole("button", { name: "Quick AI helper" })).not.toBeInTheDocument()
  })
})
