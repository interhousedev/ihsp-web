import { describe, expect, it } from "bun:test"
import { apiUrl, chatPending, ids, nbIds, server, testRouter } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderNotebook } from "../notebooks/test-support"
import { AssistantWorkspace } from "./assistant-workspace"

allowSlowRenders()

async function openSearch() {
  const result = renderNotebook(<AssistantWorkspace assistant="student" basePath="/assistant" />, {
    route: "/assistant/",
  })
  await result.user.click(await screen.findByRole("button", { name: "Search chats" }))
  const dialog = await screen.findByRole("dialog", { name: "Search chats" })
  return { ...result, dialog }
}

describe("ChatSearchDialog", () => {
  it("lists the latest chats and notebooks before anything is typed", async () => {
    const { dialog } = await openSearch()

    expect(await within(dialog).findByText("Kinematics revision")).toBeInTheDocument()
    expect(within(dialog).getByText("Homework help")).toBeInTheDocument()
    expect(within(dialog).getByText("Photosynthesis")).toBeInTheDocument()
    expect(within(dialog).getByText("World history")).toBeInTheDocument()
    expect(within(dialog).getByPlaceholderText("Search chats and notebooks")).toBeInTheDocument()
  })

  it("filters chats by title and notebooks by name as you type", async () => {
    const { user, dialog } = await openSearch()
    await within(dialog).findByText("Kinematics revision")
    const field = within(dialog).getByPlaceholderText("Search chats and notebooks")

    await user.click(field)
    await user.paste("kine")

    await waitFor(() => expect(within(dialog).queryByText("Homework help")).not.toBeInTheDocument())
    expect(within(dialog).getByText("Kinematics revision")).toBeInTheDocument()
    expect(within(dialog).queryByText("Photosynthesis")).not.toBeInTheDocument()

    await user.clear(field)
    await user.paste("PHOTO")

    expect(await within(dialog).findByText("Photosynthesis")).toBeInTheDocument()
    expect(within(dialog).queryByText("Kinematics revision")).not.toBeInTheDocument()
  })

  it("opens the highlighted chat on Enter", async () => {
    const { user, dialog } = await openSearch()
    await within(dialog).findByText("Kinematics revision")

    await user.click(within(dialog).getByPlaceholderText("Search chats and notebooks"))
    await user.paste("homework")
    await user.keyboard("{Enter}")

    await waitFor(() => expect(testRouter.push).toHaveBeenCalledWith(`/assistant/chat/?id=${ids.chat2}`))
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Search chats" })).not.toBeInTheDocument())
  })

  it("opens a notebook on click", async () => {
    const { user, dialog } = await openSearch()

    await user.click(await within(dialog).findByText("World history"))

    await waitFor(() => expect(testRouter.push).toHaveBeenCalledWith(`/notebooks/view/?id=${nbIds.notebookPinned}`))
  })

  it("also asks the server for the typed text, after a pause, and adds its hits", async () => {
    const asked: (string | null)[] = []
    server.use(
      http.get(apiUrl("/v1/ai/chats"), ({ request }) => {
        const q = new URL(request.url).searchParams.get("q")
        if (q === null) return HttpResponse.json({ items: [chatPending], next_cursor: null })
        asked.push(q)
        return HttpResponse.json({
          items: [{ ...chatPending, id: ids.chat2, title: "Older chat about integrals" }],
          next_cursor: null,
        })
      }),
    )
    const { user, dialog } = await openSearch()
    await within(dialog).findByText("Kinematics revision")
    expect(asked).toEqual([])

    await user.click(within(dialog).getByPlaceholderText("Search chats and notebooks"))
    await user.paste("integr")

    expect(await within(dialog).findByText("Older chat about integrals")).toBeInTheDocument()
    expect(asked).toEqual(["integr"])
    expect(within(dialog).queryByText("Kinematics revision")).not.toBeInTheDocument()
  })

  it("says so when nothing matches", async () => {
    const { user, dialog } = await openSearch()
    await within(dialog).findByText("Kinematics revision")

    await user.click(within(dialog).getByPlaceholderText("Search chats and notebooks"))
    await user.paste("zzzz")

    expect(await within(dialog).findByText("Nothing found")).toBeInTheDocument()
  })
})
