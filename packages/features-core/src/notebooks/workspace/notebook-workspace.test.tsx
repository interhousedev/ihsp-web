import { afterAll, afterEach, describe, expect, it, mock } from "bun:test"
import { apiUrl, nbIds, notebookDetail, problem, server, testRouter } from "@ihsp/test-utils"
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { NuqsTestingAdapter, type UrlUpdateEvent } from "nuqs/adapters/testing"
import { allowSlowRenders, renderNotebook } from "../test-support"
import { paneMocks, setWindowWidth } from "./test-support"

allowSlowRenders()

// The panes other tasks own are replaced by small stand-ins; this file tests the shell around them.
// `mock.module` is global to the process: keep the real modules and put them back when this file is done, or the
// stand-ins would be rendered by every test file that runs afterwards.
const realPanes = { ...(await import("./panes")) }
mock.module("./panes", paneMocks)

// Telegram's own Back button only exists inside the Mini App; the test keeps the handler the workspace registers.
let pressBack: () => void = () => undefined
const telegram = await import("@ihsp/telegram/core")
const realTelegram = { ...telegram }
mock.module("@ihsp/telegram/core", () => ({
  ...realTelegram,
  useBackButton: (onBack: () => void) => {
    pressBack = onBack
  },
}))
afterAll(() => {
  mock.module("./panes", () => realPanes)
  mock.module("@ihsp/telegram/core", () => realTelegram)
})
const { NotebookWorkspace } = await import("./notebook-workspace")

const VIEW = `/notebooks/view/?id=${nbIds.notebook}`

function renderWorkspace(search = "", notebookId: string = nbIds.notebook) {
  const updates: UrlUpdateEvent[] = []
  const result = renderNotebook(
    <NuqsTestingAdapter hasMemory searchParams={search} onUrlUpdate={(event) => updates.push(event)}>
      <NotebookWorkspace notebookId={notebookId} />
    </NuqsTestingAdapter>,
    { route: `${VIEW}${search ? `&${search.replace(/^\?/, "")}` : ""}` },
  )
  return { ...result, updates }
}

afterEach(() => setWindowWidth(1280))

describe("NotebookWorkspace: loading and errors", () => {
  it("shows a skeleton while the notebook loads", () => {
    renderWorkspace()

    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument()
  })

  it("says so and links to the list when the notebook does not exist", async () => {
    renderWorkspace("", "00000000-0000-4000-8000-00000000dead")

    expect(await screen.findByText("This notebook was not found.")).toBeInTheDocument()
    // next/link drops the trailing slash outside the app (no `trailingSlash` setting in tests).
    expect(screen.getByRole("link", { name: "All notebooks" })).toHaveAttribute("href", "/notebooks")
  })

  it("shows an error with Try again for any other failure and retries", async () => {
    let calls = 0
    server.use(
      http.get(apiUrl(`/v1/notebooks/${nbIds.notebook}`), () => {
        calls += 1
        return calls === 1 ? problem(500, "server/error", "Boom") : HttpResponse.json(notebookDetail)
      }),
    )
    const { user } = renderWorkspace()

    await user.click(await screen.findByRole("button", { name: "Try again" }))

    expect(await screen.findByRole("region", { name: "Chat" })).toBeInTheDocument()
    expect(calls).toBe(2)
  })
})

describe("NotebookWorkspace: layouts", () => {
  it("shows Sources, Chat and Studio side by side from 1280 px", async () => {
    setWindowWidth(1280)
    renderWorkspace()

    expect(await screen.findByRole("region", { name: "Sources" })).toBeInTheDocument()
    expect(screen.getByRole("region", { name: "Chat" })).toBeInTheDocument()
    expect(screen.getByRole("region", { name: "Studio" })).toBeInTheDocument()
    expect(screen.getByTestId("sources-panel")).toHaveTextContent("sources of Photosynthesis")
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument()
  })

  it("gives the chat the page and opens Sources and Studio as sheets from 768 to 1279 px", async () => {
    setWindowWidth(1024)
    const { user } = renderWorkspace()

    expect(await screen.findByRole("region", { name: "Chat" })).toBeInTheDocument()
    expect(screen.queryByRole("region", { name: "Sources" })).not.toBeInTheDocument()
    expect(screen.queryByRole("region", { name: "Studio" })).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Open Sources (3)" }))
    const sheet = await screen.findByRole("dialog")
    expect(within(sheet).getByRole("region", { name: "Sources" })).toBeInTheDocument()
    expect(within(sheet).getByTestId("sources-panel")).toBeInTheDocument()
    // The panel has no collapse button inside a sheet.
    expect(within(sheet).queryByRole("button", { name: "collapse sources" })).not.toBeInTheDocument()
  })

  it("opens the Studio sheet from its header button, with the number of items", async () => {
    setWindowWidth(1024)
    const { user } = renderWorkspace()

    await user.click(await screen.findByRole("button", { name: /^Open Studio \(\d+\)$/ }))

    const sheet = await screen.findByRole("dialog")
    expect(within(sheet).getByTestId("studio-panel")).toBeInTheDocument()
  })

  it("shows three tabs on a phone, with the chat first when the notebook has sources", async () => {
    setWindowWidth(360)
    renderWorkspace()

    const tablist = await screen.findByRole("tablist", { name: "Notebook sections" })
    const tabs = within(tablist).getAllByRole("tab")
    expect(tabs.map((tab) => tab.textContent)).toEqual(["Sources", "Chat", "Studio"])
    expect(tabs[1]).toHaveAttribute("aria-selected", "true")
    expect(screen.getByRole("region", { name: "Chat" })).toBeInTheDocument()
    expect(screen.queryByRole("region", { name: "Sources" })).not.toBeInTheDocument()
  })

  it("starts on Sources when the notebook has none", async () => {
    setWindowWidth(360)
    renderWorkspace("", nbIds.notebookEmpty)

    const tab = await screen.findByRole("tab", { name: "Sources" })

    expect(tab).toHaveAttribute("aria-selected", "true")
    expect(await screen.findByRole("region", { name: "Sources" })).toBeInTheDocument()
    expect(screen.queryByRole("region", { name: "Chat" })).not.toBeInTheDocument()
  })

  it("takes the tab from ?tab= and keeps it in the address when it changes", async () => {
    setWindowWidth(360)
    const { user, updates } = renderWorkspace("?tab=studio")

    expect(await screen.findByRole("region", { name: "Studio" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Studio" })).toHaveAttribute("aria-selected", "true")

    await user.click(screen.getByRole("tab", { name: "Sources" }))

    expect(await screen.findByRole("region", { name: "Sources" })).toBeInTheDocument()
    expect(screen.queryByRole("region", { name: "Studio" })).not.toBeInTheDocument()
    expect(updates.at(-1)?.searchParams.get("tab")).toBe("sources")
    expect(updates.at(-1)?.options.history).toBe("replace")
  })

  it("moves between tabs with the arrow keys", async () => {
    setWindowWidth(360)
    const { user } = renderWorkspace()
    const chatTab = await screen.findByRole("tab", { name: "Chat" })

    chatTab.focus()
    await user.keyboard("{ArrowRight}")

    expect(await screen.findByRole("region", { name: "Studio" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Studio" })).toHaveFocus()
  })

  it("follows the window width when it is resized", async () => {
    setWindowWidth(1280)
    renderWorkspace()
    await screen.findByRole("region", { name: "Sources" })

    act(() => setWindowWidth(360))

    expect(await screen.findByRole("tablist")).toBeInTheDocument()
    expect(screen.queryByRole("region", { name: "Studio" })).not.toBeInTheDocument()
  })
})

describe("NotebookWorkspace: viewers and deep links", () => {
  it("opens the source viewer at a passage from ?source= and ?passage=", async () => {
    renderWorkspace(`?source=${nbIds.sourceFile}&passage=pas-7`)

    expect(await screen.findByTestId("source-viewer")).toBeInTheDocument()
    expect(screen.getByTestId("viewer-source")).toHaveTextContent(nbIds.sourceFile)
    expect(screen.getByTestId("viewer-passage")).toHaveTextContent("pas-7")
    // The viewer takes the place of the chat.
    expect(screen.queryByRole("region", { name: "Chat" })).not.toBeInTheDocument()
  })

  it("opens an artifact from ?artifact=", async () => {
    renderWorkspace(`?artifact=${nbIds.quiz}`)

    expect(await screen.findByTestId("artifact-viewer")).toBeInTheDocument()
    expect(screen.getByTestId("viewer-artifact")).toHaveTextContent(nbIds.quiz)
  })

  it("opens the note editor from ?note=new and for an existing note", async () => {
    const first = renderWorkspace("?note=new")
    expect(await screen.findByTestId("viewer-note")).toHaveTextContent("new")
    first.unmount()

    renderWorkspace(`?note=${nbIds.sourceText}`)
    expect(await screen.findByTestId("viewer-note")).toHaveTextContent(nbIds.sourceText)
  })

  it("covers the whole phone screen with a viewer, without the header and the tab bar", async () => {
    setWindowWidth(360)
    renderWorkspace(`?source=${nbIds.sourceFile}`)

    expect(await screen.findByTestId("source-viewer")).toBeInTheDocument()
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "All notebooks" })).not.toBeInTheDocument()
  })

  it("pushes a history entry when a viewer opens and replaces it when the viewer closes", async () => {
    const { user, updates } = renderWorkspace()
    await user.click(await screen.findByRole("button", { name: "open source" }))

    await screen.findByTestId("source-viewer")
    expect(updates.at(-1)?.searchParams.get("source")).toBe("src-1")
    expect(updates.at(-1)?.searchParams.get("passage")).toBe("pas-1")
    expect(updates.at(-1)?.options.history).toBe("push")

    await user.click(screen.getByRole("button", { name: "back to chat" }))

    expect(await screen.findByRole("region", { name: "Chat" })).toBeInTheDocument()
    expect(updates.at(-1)?.searchParams.has("source")).toBe(false)
    expect(updates.at(-1)?.options.history).toBe("replace")
  })

  it("opening one viewer closes the other", async () => {
    const { user } = renderWorkspace(`?artifact=${nbIds.quiz}`)
    await screen.findByTestId("artifact-viewer")

    await user.click(screen.getByRole("button", { name: "open source" }))

    expect(await screen.findByTestId("source-viewer")).toBeInTheDocument()
    expect(screen.queryByTestId("artifact-viewer")).not.toBeInTheDocument()
  })

  it("closes the viewer with Escape and shows the chat", async () => {
    const { user } = renderWorkspace(`?source=${nbIds.sourceFile}`)
    await screen.findByTestId("source-viewer")

    await user.keyboard("{Escape}")

    expect(await screen.findByRole("region", { name: "Chat" })).toBeInTheDocument()
    expect(screen.queryByTestId("source-viewer")).not.toBeInTheDocument()
  })

  it("lets an open dialog take the Escape key before the viewer", async () => {
    const { user } = renderWorkspace(`?source=${nbIds.sourceFile}`)
    await screen.findByTestId("source-viewer")
    await user.click(screen.getByRole("button", { name: "Notebook menu" }))
    await user.click(await screen.findByRole("menuitem", { name: "Delete notebook" }))
    await screen.findByRole("alertdialog")

    fireEvent.keyDown(document.body, { key: "Escape" })

    expect(screen.getByTestId("source-viewer")).toBeInTheDocument()
  })

  it("keeps the chat mounted behind a viewer", async () => {
    const { user } = renderWorkspace()
    const chat = await screen.findByTestId("notebook-chat")

    await user.click(screen.getByRole("button", { name: "open source" }))
    await screen.findByTestId("source-viewer")

    expect(screen.getByTestId("notebook-chat")).toBe(chat)
  })
})

describe("NotebookWorkspace: ask", () => {
  it("closes the viewer, shows the chat and hands the question to it until it is handled", async () => {
    const { user } = renderWorkspace(`?source=${nbIds.sourceFile}`)
    await screen.findByTestId("source-viewer")

    await user.click(screen.getByRole("button", { name: "ask from sources" }))

    expect(await screen.findByRole("region", { name: "Chat" })).toBeInTheDocument()
    expect(screen.queryByTestId("source-viewer")).not.toBeInTheDocument()
    expect(screen.getByTestId("pending-ask")).toHaveTextContent("Explain the topic")

    await user.click(screen.getByRole("button", { name: "handle ask" }))

    await waitFor(() => expect(screen.getByTestId("pending-ask")).toBeEmptyDOMElement())
  })

  it("switches a phone to the chat tab", async () => {
    setWindowWidth(360)
    const { user, updates } = renderWorkspace("?tab=sources")
    await user.click(await screen.findByRole("button", { name: "ask from sources" }))

    expect(await screen.findByRole("region", { name: "Chat" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Chat" })).toHaveAttribute("aria-selected", "true")
    expect(updates.at(-1)?.searchParams.get("tab")).toBe("chat")
    expect(screen.getByTestId("pending-ask")).toHaveTextContent("Explain the topic")
  })

  it("closes the Sources sheet on a tablet", async () => {
    setWindowWidth(1024)
    const { user } = renderWorkspace()
    await user.click(await screen.findByRole("button", { name: "Open Sources (3)" }))
    await user.click(await within(await screen.findByRole("dialog")).findByRole("button", { name: "ask from sources" }))

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(screen.getByTestId("pending-ask")).toHaveTextContent("Explain the topic")
  })
})

describe("NotebookWorkspace: Add sources and shortcuts", () => {
  it("opens the Add sources dialog once for ?add=1 and clears the parameter", async () => {
    const { updates } = renderWorkspace("?add=1")

    expect(await screen.findByTestId("add-sources-dialog")).toBeInTheDocument()
    await waitFor(() => expect(updates.at(-1)?.searchParams.has("add")).toBe(false))
  })

  it("does not open the dialog without ?add=1", async () => {
    renderWorkspace()
    await screen.findByRole("region", { name: "Chat" })

    expect(screen.queryByTestId("add-sources-dialog")).not.toBeInTheDocument()
  })

  it("collapses a side pane to a 56 px rail with its count, and brings it back", async () => {
    const { user } = renderWorkspace()
    await user.click(await screen.findByRole("button", { name: "collapse sources" }))

    const rail = await screen.findByRole("button", { name: "Show Sources" })
    expect(rail).toHaveTextContent("3")
    expect(screen.queryByTestId("sources-panel")).not.toBeInTheDocument()
    expect(screen.getByTestId("studio-panel")).toBeInTheDocument()

    await user.click(rail)

    expect(await screen.findByTestId("sources-panel")).toBeInTheDocument()
  })

  it("collapses Sources with [ and Studio with ]", async () => {
    const { user } = renderWorkspace()
    await screen.findByTestId("studio-panel")

    await user.keyboard("[[")
    expect(await screen.findByRole("button", { name: "Show Sources" })).toBeInTheDocument()
    await user.keyboard("]")
    expect(await screen.findByRole("button", { name: "Show Studio" })).toBeInTheDocument()

    await user.keyboard("[[")
    await waitFor(() => expect(screen.queryByRole("button", { name: "Show Sources" })).not.toBeInTheDocument())
  })

  it("focuses the composer with /", async () => {
    const { user } = renderWorkspace()
    const composer = await screen.findByLabelText("composer")

    await user.keyboard("/")

    expect(composer).toHaveFocus()
  })

  it("closes a viewer first when / is pressed, then focuses the composer", async () => {
    const { user } = renderWorkspace(`?artifact=${nbIds.quiz}`)
    await screen.findByTestId("artifact-viewer")

    await user.keyboard("/")

    await waitFor(() => expect(screen.getByLabelText("composer")).toHaveFocus())
    expect(screen.queryByTestId("artifact-viewer")).not.toBeInTheDocument()
  })

  it("leaves / and [ alone while typing in a field", async () => {
    const { user } = renderWorkspace()
    const composer = await screen.findByLabelText("composer")

    await user.click(composer)
    await user.keyboard("a/[[b")

    expect(composer).toHaveValue("a/[b")
    expect(screen.queryByRole("button", { name: "Show Sources" })).not.toBeInTheDocument()
  })
})

describe("NotebookWorkspace: Back", () => {
  it("closes the open viewer first", async () => {
    renderWorkspace(`?source=${nbIds.sourceFile}`)
    await screen.findByTestId("source-viewer")

    act(() => pressBack())

    expect(await screen.findByRole("region", { name: "Chat" })).toBeInTheDocument()
    expect(screen.queryByTestId("source-viewer")).not.toBeInTheDocument()
    expect(testRouter.push).not.toHaveBeenCalled()
  })

  it("goes to the list when no viewer is open", async () => {
    renderWorkspace()
    await screen.findByTestId("notebook-chat")

    act(() => pressBack())

    expect(testRouter.push).toHaveBeenCalledWith("/notebooks/")
  })
})
