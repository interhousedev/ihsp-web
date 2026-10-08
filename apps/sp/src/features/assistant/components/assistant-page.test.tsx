import { describe, expect, it } from "bun:test"
import { apiUrl, ids, server, testRouter } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderTools } from "../utils/tools-test-utils"
import { AssistantPage } from "./assistant-page"

allowSlowRenders()

describe("AssistantPage (WEB-25, UF-WEB-19)", () => {
  it("shows the page title and the student's chats", async () => {
    renderTools(<AssistantPage />, { route: "/assistant/" })

    expect(screen.getByRole("heading", { level: 1, name: "Assistant" })).toBeInTheDocument()
    expect(await screen.findByText("Kinematics revision")).toBeInTheDocument()
    expect(screen.getByText("Homework help")).toBeInTheDocument()
    expect(screen.getByText("Choose a chat from the list or start a new one.")).toBeInTheDocument()
  })

  it("starts a new chat and opens it", async () => {
    server.use(
      http.post(apiUrl("/v1/ai/chats"), () =>
        HttpResponse.json({
          id: ids.chat2,
          assistant: "student",
          title: "New chat",
          last_message_at: "2026-10-07T05:12:00Z",
          pending_approvals: 0,
        }),
      ),
    )
    const { user } = renderTools(<AssistantPage />, { route: "/assistant/" })

    await user.click(await screen.findByRole("button", { name: "New chat" }))

    await waitFor(() => expect(testRouter.push).toHaveBeenCalledWith(`/assistant/chat/?id=${ids.chat2}`))
  })

  it("opens a chat from the address and shows its messages", async () => {
    renderTools(<AssistantPage />, { route: `/assistant/chat/?id=${ids.chat2}` })

    expect(await screen.findByText("Explain Newton's second law")).toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: "Message" })).toBeEnabled()
  })

  it("shows an error with a retry when the chats cannot be loaded", async () => {
    server.use(http.get(apiUrl("/v1/ai/chats"), () => HttpResponse.error()))
    renderTools(<AssistantPage />, { route: "/assistant/" })

    expect(await screen.findByRole("button", { name: "Try again" })).toBeInTheDocument()
  })
})
