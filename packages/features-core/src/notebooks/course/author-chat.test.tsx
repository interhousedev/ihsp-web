import { describe, expect, it } from "bun:test"
import { apiUrl, authorChatEmpty, courseIds, server } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderNotebook } from "../test-support"
import { AuthorChat } from "./author-chat"

allowSlowRenders()

function renderAuthor() {
  return renderNotebook(<AuthorChat courseId={courseIds.course} notebookId={courseIds.workspace} />, {
    actions: { notebookId: courseIds.workspace },
  })
}

describe("AuthorChat", () => {
  it("opens the newest chat of the course and shows the pending approval of apply_outline", async () => {
    renderAuthor()

    expect(await screen.findByRole("combobox", { name: "Author assistant chat" })).toHaveValue(courseIds.authorChat)
    expect(await screen.findByText("Add to the course outline")).toBeInTheDocument()
    // The text of a round that waits for approval is a progress note, not the answer.
    expect(screen.queryByText(/I propose to add one section with two steps/)).toBeNull()
    expect(screen.getByText("Conservation of energy")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Approve" })).toBeInTheDocument()
  })

  it("approves the call, shows the answer and refreshes the course draft", async () => {
    const { user, queryClient } = renderAuthor()
    queryClient.setQueryData(["lms", "course", courseIds.course, "draft"], { stale: true })

    await user.click(await screen.findByRole("button", { name: "Approve" }))

    expect(await screen.findByText(/with two steps is in the draft/)).toBeInTheDocument()
    await waitFor(() =>
      expect(queryClient.getQueryState(["lms", "course", courseIds.course, "draft"])?.isInvalidated).toBe(true),
    )
  })

  it("offers starter prompts in an empty chat and fills the field from one", async () => {
    server.use(http.get(apiUrl(`/v1/ai/chats/${courseIds.authorChat}`), () => HttpResponse.json(authorChatEmpty)))
    const { user } = renderAuthor()

    const starters = within(await screen.findByRole("list", { name: "Ideas to start with" }))
    await user.click(starters.getByRole("button", { name: "Plan a course" }))

    expect(screen.getByRole("textbox", { name: "Message" })).toHaveValue("Plan a course on ")
  })

  it("sends a message and shows the answer", async () => {
    const { user } = renderAuthor()
    const field = await screen.findByRole("textbox", { name: "Message" })

    await user.type(field, "Add a test")
    await user.click(screen.getByRole("button", { name: "Send" }))

    expect(await screen.findByText(/You asked: "Add a test"/)).toBeInTheDocument()
  })
})
