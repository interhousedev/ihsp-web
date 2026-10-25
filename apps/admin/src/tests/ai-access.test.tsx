/** AI-ACCESS: an administrator turns the chat or notebook AI off for one student, after a confirm step. */
import { describe, expect, test } from "bun:test"
import { apiUrl, server } from "@ihsp/test-utils"
import { fireEvent, screen, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { AiAccessSection } from "../features/limits/components/ai-access-section"
import { configureTests, renderAdmin, waitUntil } from "./helpers"

configureTests()

describe("AI access by user (AI-ACCESS)", () => {
  test("turning the chat AI off asks first, then saves only the chat flag", async () => {
    let body: unknown
    server.use(
      http.put(apiUrl("/v1/admin/ai/users/:id/access"), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ user_id: "x", ai_chat_blocked: true, ai_notebooks_blocked: false })
      }),
    )
    renderAdmin(<AiAccessSection />, { route: "/limits/" })
    fireEvent.change(screen.getByLabelText("Find a student"), { target: { value: "Aziza" } })
    fireEvent.click(await screen.findByRole("button", { name: /Aziza Karimova/ }))

    const chat = (await screen.findByText("Chat AI")).closest("label") as HTMLElement
    fireEvent.click(within(chat).getByRole("switch"))

    expect(await screen.findByText("Turn off Chat AI for Aziza Karimova?")).toBeInTheDocument()
    expect(body).toBeUndefined()
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }))

    await waitUntil(() => body !== undefined, "no save")
    expect(body).toEqual({ ai_chat_blocked: true, ai_notebooks_blocked: false })
  })
})
