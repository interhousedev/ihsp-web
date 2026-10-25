import { describe, expect, it } from "bun:test"
import { courseIds, courseWorkspaceDetail, notebookDetail } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { allowSlowRenders, renderNotebook } from "../test-support"
import { NotebookHeader } from "./notebook-header"
import { NotebookMenu } from "./notebook-menu"
import { ChatPane } from "./chat-pane"

allowSlowRenders()

describe("NotebookHeader of a course workspace", () => {
  it("leads back to the course editor and cannot be renamed", async () => {
    renderNotebook(<NotebookHeader notebook={courseWorkspaceDetail} />, {
      actions: { notebookId: courseIds.workspace },
    })

    expect(await screen.findByRole("link", { name: "Back to the course editor" })).toHaveAttribute(
      "href",
      `/edit?id=${courseIds.course}`,
    )
    expect(screen.getByRole("heading", { name: "Mechanics for Grade 10" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Mechanics for Grade 10" })).not.toBeInTheDocument()
  })

  it("still leads back to the list for a student's notebook", async () => {
    renderNotebook(<NotebookHeader notebook={notebookDetail} />)

    expect(await screen.findByRole("link", { name: "All notebooks" })).toHaveAttribute("href", "/notebooks")
  })

  it("has no Delete notebook entry in the menu of a course workspace", async () => {
    const { user } = renderNotebook(<NotebookMenu notebook={courseWorkspaceDetail} />, {
      actions: { notebookId: courseIds.workspace },
    })

    await user.click(await screen.findByRole("button", { name: "Notebook menu" }))
    expect(await screen.findByRole("menuitem", { name: "Configure chat" })).toBeInTheDocument()
    expect(screen.queryByRole("menuitem", { name: "Delete notebook" })).not.toBeInTheDocument()
  })
})

describe("ChatPane of a course workspace", () => {
  it("switches between the sources chat and the author assistant", async () => {
    const { user } = renderNotebook(
      <ChatPane notebook={courseWorkspaceDetail} pendingAsk={null} onAskHandled={() => undefined} />,
      { actions: { notebookId: courseIds.workspace } },
    )

    const group = await screen.findByRole("group", { name: "Chat mode" })
    expect(group).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Author assistant" }))
    expect(await screen.findByRole("combobox", { name: "Author assistant chat" })).toBeInTheDocument()
  })

  it("shows only the sources chat to a reader", async () => {
    renderNotebook(
      <ChatPane
        notebook={{ ...courseWorkspaceDetail, can_write: false }}
        pendingAsk={null}
        onAskHandled={() => undefined}
      />,
      { actions: { notebookId: courseIds.workspace } },
    )

    expect(
      await screen.findByText("You can read this workspace but not change it, so the chat is off."),
    ).toBeInTheDocument()
    expect(screen.queryByRole("group", { name: "Chat mode" })).not.toBeInTheDocument()
  })

  it("never shows the author assistant to a learner's own course notebook", async () => {
    renderNotebook(
      <ChatPane
        notebook={{ ...courseWorkspaceDetail, origin: "course_student", can_write: true }}
        pendingAsk={null}
        onAskHandled={() => undefined}
      />,
      { actions: { notebookId: courseIds.workspace } },
    )

    expect(await screen.findByRole("textbox", { name: "Message" })).toBeInTheDocument()
    expect(screen.queryByRole("group", { name: "Chat mode" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Author assistant" })).not.toBeInTheDocument()
  })
})
