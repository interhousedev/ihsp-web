import { describe, expect, it, mock } from "bun:test"
import type { ToolCallView as ToolCall } from "@ihsp/api"
import { screen, waitFor } from "@testing-library/react"
import { allowSlowRenders, renderNotebook } from "../notebooks/test-support"
import { ChatCommandsProvider } from "./chat-commands"
import { ToolCallView } from "./tool-call-view"

allowSlowRenders()

const call = {
  id: "0000000b-0000-4000-8000-0000000000c1",
  tool: "admission_suggest",
  access: "read",
  status: "done",
  note: "Suggested",
  preview: null,
  cards: [
    {
      type: "course",
      id: "course-1",
      title: "SAT Prep",
      reason: "Matches your target score",
      link: "/courses/?id=course-1",
    },
  ],
} as unknown as ToolCall

describe("SuggestionCards", () => {
  it("shows type, title and reason, links out and sends one 'add' message to the assistant", async () => {
    const say = mock(() => Promise.resolve(true))
    const { user } = renderNotebook(
      <ChatCommandsProvider value={{ say }}>
        <ToolCallView call={call} busy={false} onApprove={() => {}} onReject={() => {}} />
      </ChatCommandsProvider>,
    )

    expect(screen.getByText("SAT Prep")).toBeInTheDocument()
    expect(screen.getByText("Matches your target score")).toBeInTheDocument()
    expect(screen.getByRole("link").getAttribute("href")).toContain("id=course-1")

    await user.click(screen.getByRole("button", { name: "Add" }))
    expect(say).toHaveBeenCalledTimes(1)
    const sent = (say.mock.calls as unknown as string[][])[0]?.[0] ?? ""
    expect(sent).toContain("SAT Prep")
    expect(sent).toContain("course-1")
    await waitFor(() => expect(screen.getByRole("button", { name: /requested/i })).toBeDisabled())
  })
})
