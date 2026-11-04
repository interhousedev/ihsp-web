import { describe, expect, it } from "bun:test"
import { apiUrl, projectChatItems, projectIds, server, testRouter } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { AssistantWorkspace } from "../assistant-chat/assistant-workspace"
import { allowSlowRenders, renderNotebook } from "../notebooks/test-support"

allowSlowRenders()

/** Base UI keeps `pointer-events: none` on the parent of an open popup; real pointers are not blocked by it. */
const loose = userEvent.setup({ pointerEventsCheck: 0 })

function renderAssistant(route: string) {
  return renderNotebook(<AssistantWorkspace assistant="student" basePath="/assistant" />, { route })
}

const PROJECT_PAGE = `/assistant/project/?id=${projectIds.physics}`

// `next/link` drops the trailing slash of a link outside the static export, so the slash is optional in these.
const PROJECT_HREF = new RegExp(`/assistant/project/?\\?id=${projectIds.physics}$`)
const CHAT_HREF = new RegExp(`/assistant/chat/?\\?id=${projectChatItems[0]?.id}$`)

describe("Projects: list", () => {
  it("lists the student's projects, each linking to its page", async () => {
    renderAssistant("/assistant/projects/")

    // The link name of the list carries the date too; the sidebar row of the same project is the bare name.
    const link = await screen.findByRole("link", { name: /^Physics lab./ })
    expect(link.getAttribute("href")).toMatch(PROJECT_HREF)
    expect(screen.getByRole("link", { name: /^Essay on Pushkin./ })).toBeInTheDocument()
  })

  it("creates a project from the New project dialog and lists it", async () => {
    renderAssistant("/assistant/projects/")

    const buttons = await screen.findAllByRole("button", { name: "New project" })
    await loose.click(buttons.at(-1) as HTMLElement)
    const dialog = await screen.findByRole("dialog", { name: "New project" })
    await loose.type(within(dialog).getByRole("textbox", { name: "Project name" }), "Biology")
    await loose.click(within(dialog).getByRole("button", { name: "Create project" }))

    expect(await screen.findByRole("link", { name: /^Biology./ })).toBeInTheDocument()
  })
})

describe("Projects: page", () => {
  it("shows the title, the composer for a new chat in the project and the Chats tab", async () => {
    renderAssistant(PROJECT_PAGE)

    expect(await screen.findByRole("heading", { level: 1, name: "Physics lab" })).toBeInTheDocument()
    const composer = await screen.findByRole("textbox", { name: "Message" })
    expect(composer).toHaveAttribute("placeholder", "New chat in Physics lab")
    const tabs = screen.getByRole("tablist")
    expect(within(tabs).getByRole("tab", { name: "Chats", selected: true })).toBeInTheDocument()
    expect(within(tabs).getByRole("tab", { name: "Sources" })).toBeInTheDocument()
  })

  it("lists the project's chats as rows that open the chat", async () => {
    renderAssistant(PROJECT_PAGE)

    const row = await screen.findByRole("link", { name: /Ohm's law/ })
    expect(row.getAttribute("href")).toMatch(CHAT_HREF)
  })

  it("starts a chat in the project, which then shows in its Chats tab", async () => {
    renderAssistant(PROJECT_PAGE)

    await loose.type(await screen.findByRole("textbox", { name: "Message" }), "Why does current split?")
    await loose.click(screen.getByRole("button", { name: "Send" }))

    await waitFor(() => expect(testRouter.push).toHaveBeenCalled())
    expect(String(testRouter.push.mock.calls.at(-1)?.[0])).toMatch(/^\/assistant\/chat\/\?id=/)
    const tabpanel = await screen.findByRole("tabpanel")
    expect(await within(tabpanel).findByRole("link", { name: /New chat/ })).toBeInTheDocument()
  })

  it("renames the project from its options menu", async () => {
    renderAssistant(PROJECT_PAGE)

    await loose.click(await screen.findByRole("button", { name: "Project options" }))
    await loose.click(await screen.findByRole("menuitem", { name: "Rename" }))
    const dialog = await screen.findByRole("dialog", { name: "Rename project" })
    const field = within(dialog).getByRole("textbox", { name: "Project name" })
    await loose.clear(field)
    await loose.type(field, "Physics lab 2")
    await loose.click(within(dialog).getByRole("button", { name: "Save" }))

    expect(await screen.findByRole("heading", { level: 1, name: "Physics lab 2" })).toBeInTheDocument()
  })

  it("deletes the project only after confirmation and leaves for the list", async () => {
    let deleted = 0
    server.use(
      http.delete(apiUrl(`/v1/ai/projects/${projectIds.physics}`), () => {
        deleted += 1
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderAssistant(PROJECT_PAGE)

    await loose.click(await screen.findByRole("button", { name: "Project options" }))
    await loose.click(await screen.findByRole("menuitem", { name: "Delete project" }))
    const dialog = await screen.findByRole("alertdialog", { name: "Delete this project?" })
    expect(deleted).toBe(0)

    await loose.click(within(dialog).getByRole("button", { name: "Delete project" }))

    await waitFor(() => expect(deleted).toBe(1))
    expect(testRouter.push).toHaveBeenCalledWith("/assistant/projects/")
  })

  it("lists the sources and detaches one", async () => {
    renderAssistant(PROJECT_PAGE)

    await loose.click(await screen.findByRole("tab", { name: "Sources" }))
    expect(await screen.findByText("lab-notes.pdf")).toBeInTheDocument()
    await loose.click(screen.getByRole("button", { name: "Remove lab-notes.pdf" }))

    await waitFor(() => expect(screen.queryByText("lab-notes.pdf")).not.toBeInTheDocument())
  })
})

describe("Projects: page rows", () => {
  it("shows the last question of a chat as the snippet of its row", async () => {
    const chat = projectChatItems[0]
    server.use(
      http.get(apiUrl(`/v1/ai/chats/${chat?.id}`), () =>
        HttpResponse.json({
          ...chat,
          shared: false,
          messages: [
            { seq: 1, role: "user", text: "What is resistance?", file_ids: [], tool_calls: [], web: [] },
            { seq: 2, role: "assistant", text: "Opposition to current.", file_ids: [], tool_calls: [], web: [] },
          ],
        }),
      ),
    )
    renderAssistant(PROJECT_PAGE)

    const row = await screen.findByRole("link", { name: /Ohm's law/ })
    await within(row).findByText("What is resistance?")
  })

  it("uploads a file from the Sources tab and attaches it to the project", async () => {
    const attached: unknown[] = []
    server.use(
      http.post(apiUrl(`/v1/ai/projects/${projectIds.physics}/files`), async ({ request }) => {
        attached.push(await request.json())
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderAssistant(PROJECT_PAGE)

    await loose.click(await screen.findByRole("tab", { name: "Sources" }))
    const panel = await screen.findByRole("tabpanel")
    expect(await within(panel).findByRole("button", { name: "Upload a file" })).toBeInTheDocument()
    const input = within(panel).getByTestId("file-upload-input") as HTMLInputElement
    await loose.upload(input, new File(["hello"], "notes.pdf", { type: "application/pdf" }))

    await waitFor(() => expect(attached.length).toBe(1))
  })
})

async function sidebar() {
  return screen.findByRole("navigation", { name: "Chats and notebooks" })
}

describe("Projects: sidebar", () => {
  it("opens a real dialog from New project, creates it and goes to its page", async () => {
    renderAssistant("/assistant/")

    const nav = await sidebar()
    await loose.click(within(nav).getByRole("button", { name: "New project" }))
    const dialog = await screen.findByRole("dialog", { name: "New project" })
    await loose.type(within(dialog).getByRole("textbox", { name: "Project name" }), "Biology")
    await loose.click(within(dialog).getByRole("button", { name: "Create project" }))

    await waitFor(() => expect(String(testRouter.push.mock.calls.at(-1)?.[0])).toMatch(/^\/assistant\/project\/\?id=/))
    expect(await within(nav).findByRole("link", { name: "Biology" })).toBeInTheDocument()
  })

  it("lists projects with folder rows, each expanding to its chats", async () => {
    renderAssistant("/assistant/")

    const nav = await sidebar()
    const link = await within(nav).findByRole("link", { name: "Physics lab" })
    expect(link.getAttribute("href")).toMatch(PROJECT_HREF)
    expect(within(nav).queryByRole("link", { name: "All projects" })).toBeNull()
    await loose.click(within(nav).getByRole("button", { name: "Show chats of Physics lab" }))
    expect(await within(nav).findByRole("link", { name: "Ohm's law" })).toBeInTheDocument()
  })

  it("shows five chats of a project and reveals more with Show more", async () => {
    const items = Array.from({ length: 7 }, (_, index) => ({
      ...projectChatItems[0],
      id: `00000022-0000-4000-8000-00000000010${index}`,
      title: `Chat ${index + 1}`,
    }))
    server.use(http.get(apiUrl("/v1/ai/chats"), () => HttpResponse.json({ items, next_cursor: null })))
    renderAssistant("/assistant/")

    const nav = await sidebar()
    await loose.click(await within(nav).findByRole("button", { name: "Show chats of Physics lab" }))
    const group = await within(nav).findByRole("list", { name: "Physics lab" })
    await within(group).findByRole("link", { name: "Chat 5" })
    expect(within(group).queryByRole("link", { name: "Chat 6" })).toBeNull()
    await loose.click(within(group).getByRole("button", { name: "Show more" }))
    expect(within(group).getByRole("link", { name: "Chat 7" })).toBeInTheDocument()
  })

  it("has hover actions: new chat in the project and options with rename", async () => {
    renderAssistant("/assistant/")

    const nav = await sidebar()
    const newChat = await within(nav).findByRole("link", { name: "New chat in Physics lab" })
    expect(newChat.getAttribute("href")).toMatch(PROJECT_HREF)
    await loose.click(within(nav).getByRole("button", { name: "Options for Physics lab" }))
    await loose.click(await screen.findByRole("menuitem", { name: "Rename" }))
    expect(await screen.findByRole("dialog", { name: "Rename project" })).toBeInTheDocument()
  })

  it("remembers a collapsed Projects section after a reload", async () => {
    const first = renderAssistant("/assistant/")
    const nav = await sidebar()
    const toggle = within(nav).getByRole("button", { name: "Projects" })
    expect(toggle).toHaveAttribute("aria-expanded", "true")
    await loose.click(toggle)
    first.unmount()

    renderAssistant("/assistant/")
    const again = await sidebar()
    expect(within(again).getByRole("button", { name: "Projects" })).toHaveAttribute("aria-expanded", "false")
  })
})
