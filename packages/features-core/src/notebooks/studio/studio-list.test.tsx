import { describe, expect, it, spyOn } from "bun:test"
import type { ArtifactItem } from "@ihsp/api"
import {
  apiUrl,
  artifactFailed,
  artifactFlashcards,
  artifactGenerating,
  artifactMindMap,
  artifactQuiz,
  artifactReport,
  nbIds,
  notebookDetail,
  server,
} from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import type { UserEvent } from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { toast } from "sonner"
import { allowSlowRenders, renderNotebook } from "../test-support"
import { StudioPanel } from "./studio-panel"

allowSlowRenders()

const ARTIFACTS_URL = apiUrl(`/v1/notebooks/${nbIds.notebook}/artifacts`)

function listOf(...items: ArtifactItem[]) {
  server.use(http.get(ARTIFACTS_URL, () => HttpResponse.json(items)))
}

async function itemList(): Promise<HTMLElement> {
  return screen.findByRole("list", { name: "Studio items" })
}

async function row(title: string): Promise<HTMLElement> {
  const list = await itemList()
  return within(list).getByText(title).closest("li") as HTMLElement
}

/** The button that opens an item: its name is the title, the "New" mark and the subtitle. */
async function openerOf(title: string): Promise<HTMLElement> {
  return within(await row(title)).getAllByRole("button")[0] as HTMLElement
}

async function openMenu(user: UserEvent, title: string): Promise<void> {
  await user.click(await screen.findByRole("button", { name: `Actions for ${title}` }))
}

function menuItemNames(): string[] {
  return screen.getAllByRole("menuitem").map((entry) => entry.textContent ?? "")
}

describe("StudioList: rows", () => {
  it("shows icon, title and the subtitle with the source count", async () => {
    listOf(artifactMindMap)
    renderNotebook(<StudioPanel notebook={notebookDetail} />)

    const item = await row("Photosynthesis")

    expect(await openerOf("Photosynthesis")).toHaveAccessibleName(/^Photosynthesis 3 sources · /)
    expect(item).toHaveTextContent("3 sources · ")
    expect(item.querySelector("svg.tabler-icon-sitemap")).not.toBeNull()
  })

  it("falls back to the kind name when the title is empty", async () => {
    listOf({ ...artifactQuiz, title: "" }, { ...artifactReport, title: "", format: "faq" })
    renderNotebook(<StudioPanel notebook={notebookDetail} />)

    expect(await openerOf("Quiz")).toHaveAccessibleName(/^Quiz 3 sources/)
    expect(await openerOf("FAQ")).toHaveAccessibleName(/^FAQ New 3 sources/)
  })

  it("marks an unread ready item with a New dot and clears it when the item is opened", async () => {
    listOf(artifactReport, artifactMindMap)
    const { user, actions } = renderNotebook(<StudioPanel notebook={notebookDetail} />)

    const unread = await openerOf("Photosynthesis: conspect")
    expect(unread).toHaveAccessibleName(/^Photosynthesis: conspect New /)
    expect(await openerOf("Photosynthesis")).not.toHaveAccessibleName(/New/)

    await user.click(unread)

    expect(actions.openArtifact).toHaveBeenCalledWith(artifactReport.id)
    await waitFor(async () => expect(await openerOf("Photosynthesis: conspect")).not.toHaveAccessibleName(/New/))
  })

  it("shows a running item with a spinner, the generating text and its progress, and does not open it", async () => {
    listOf(artifactGenerating)
    const { user, actions } = renderNotebook(<StudioPanel notebook={notebookDetail} />)

    const item = await row("Quiz")

    expect(within(item).getByText("Generating… this can take a minute. You can leave this page.")).toBeInTheDocument()
    expect(within(item).getByRole("progressbar", { name: "Progress" })).toHaveAttribute("aria-valuenow", "40")
    expect(within(item).queryByRole("button", { name: "Quiz" })).not.toBeInTheDocument()
    await user.click(within(item).getByText("Quiz"))
    expect(actions.openArtifact).not.toHaveBeenCalled()
  })

  it("shows no progress bar while the progress is unknown", async () => {
    listOf({ ...artifactGenerating, progress: null })
    renderNotebook(<StudioPanel notebook={notebookDetail} />)

    const item = await row("Quiz")

    expect(within(item).queryByRole("progressbar")).not.toBeInTheDocument()
  })

  it("shows a canceled item as canceled", async () => {
    listOf({ ...artifactGenerating, status: "canceled", progress: null })
    renderNotebook(<StudioPanel notebook={notebookDetail} />)

    expect(await within(await row("Quiz")).findByText("Canceled")).toBeInTheDocument()
  })

  it("lists the newest item first", async () => {
    listOf(artifactMindMap, artifactReport)
    renderNotebook(<StudioPanel notebook={notebookDetail} />)

    const list = await itemList()

    const [first, second] = within(list).getAllByRole("listitem")
    expect(first).toHaveTextContent("Photosynthesis")
    expect(first).not.toHaveTextContent("conspect")
    expect(second).toHaveTextContent("Photosynthesis: conspect")
  })
})

describe("StudioList: a created item becomes ready", () => {
  it("polls: queued, generating, then ready with the blue dot", async () => {
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)
    await itemList()

    await user.click(screen.getByRole("button", { name: "Data table" }))

    // The new item shows at once, still being created.
    const list = screen.getByRole("list", { name: "Studio items" })
    await waitFor(() => expect(within(list).getAllByText(/Generating…/).length).toBeGreaterThan(0))
    // The list polls every 3 s while something is active; the stateful backend flips it to ready on the second poll.
    const ready = await screen.findByRole("button", { name: /^Stages of photosynthesis New/ }, { timeout: 12_000 })
    expect(ready).toBeInTheDocument()
    expect(within(screen.getByRole("list", { name: "Studio items" })).queryAllByText(/Generating…/)).toHaveLength(0)
  }, 30_000)
})

describe("StudioList: failed items", () => {
  it("shows the reason and posts a retry on Try again", async () => {
    const retried: string[] = []
    listOf(artifactFailed)
    server.use(
      http.post(`${ARTIFACTS_URL}/:aid/retry`, ({ params }) => {
        retried.push(String(params.aid))
        return HttpResponse.json({ ...artifactFailed, status: "queued", error: null }, { status: 202 })
      }),
    )
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)

    const item = await row("Flash cards")
    expect(within(item).getByRole("img", { name: "Could not create" })).toBeInTheDocument()
    expect(within(item).getByText("The result was not valid. Try again.")).toBeInTheDocument()

    await user.click(within(item).getByRole("button", { name: "Try again" }))

    await waitFor(() => expect(retried).toEqual([artifactFailed.id]))
  })

  it("uses the generic reason for an unknown error code", async () => {
    listOf({
      ...artifactFailed,
      error: { code: "something_new", message_key: "x", params: {} },
    })
    renderNotebook(<StudioPanel notebook={notebookDetail} />)

    expect(await within(await row("Flash cards")).findByText("Could not create this material.")).toBeInTheDocument()
  })

  it("offers View prompt and Delete, but not Rename, in the menu of a failed item", async () => {
    listOf(artifactFailed)
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)
    await row("Flash cards")

    await openMenu(user, "Flash cards")

    expect(menuItemNames()).toEqual(["View prompt", "Delete"])
  })
})

describe("StudioList: item menu", () => {
  it("lists the actions of a ready report", async () => {
    listOf(artifactReport)
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)
    await row("Photosynthesis: conspect")

    await openMenu(user, "Photosynthesis: conspect")

    expect(menuItemNames()).toEqual([
      "Rename",
      "View prompt",
      "Add as source",
      "Download .docx",
      "Share",
      "Add to my files",
      "Delete",
    ])
  })

  it("renames an item", async () => {
    listOf(artifactMindMap)
    let sent: unknown
    server.use(
      http.patch(`${ARTIFACTS_URL}/:aid`, async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json({
          ...artifactMindMap,
          title: "Photosynthesis map",
        })
      }),
    )
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)
    await row("Photosynthesis")

    await openMenu(user, "Photosynthesis")
    await user.click(await screen.findByRole("menuitem", { name: "Rename" }))
    const dialog = await screen.findByRole("dialog", { name: "Rename item" })
    const title = within(dialog).getByRole("textbox", { name: "Title" })
    expect(title).toHaveValue("Photosynthesis")
    await user.clear(title)
    await user.click(title)
    await user.paste("Photosynthesis map")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))

    await waitFor(() => expect(sent).toEqual({ title: "Photosynthesis map" }))
    expect(
      await screen.findByRole("button", {
        name: /^Photosynthesis map 3 sources/,
      }),
    ).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  it("shows the options and the focus text in View prompt, not a system prompt", async () => {
    listOf(artifactQuiz)
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)
    await row("Photosynthesis: quiz")

    await openMenu(user, "Photosynthesis: quiz")
    await user.click(await screen.findByRole("menuitem", { name: "View prompt" }))

    const dialog = await screen.findByRole("dialog", { name: "Prompt" })
    const text = dialog.textContent ?? ""
    expect(text).toContain("TypeQuiz")
    expect(text).toContain("NumberStandard")
    expect(text).toContain("DifficultyMedium")
    expect(text).toContain("Question typesSingle choice, Multiple choice, True / false")
    expect(text).toContain("LanguageAuto")
    expect(within(dialog).getByText("Only the Calvin cycle")).toBeInTheDocument()
  })

  it("says so when there is no focus text", async () => {
    listOf(artifactMindMap)
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)
    await row("Photosynthesis")

    await openMenu(user, "Photosynthesis")
    await user.click(await screen.findByRole("menuitem", { name: "View prompt" }))

    expect(await screen.findByText("No focus text was given.")).toBeInTheDocument()
  })

  it("adds a report as a source and says so", async () => {
    listOf(artifactReport)
    const success = spyOn(toast, "success").mockImplementation(() => "")
    let called = false
    server.use(
      http.post(`${ARTIFACTS_URL}/:aid/save-as-source`, () => {
        called = true
        return HttpResponse.json(
          {
            id: "s-new",
            notebook_id: nbIds.notebook,
            kind: "note",
            title: "Photosynthesis: conspect",
            status: "ready",
          },
          { status: 201 },
        )
      }),
    )
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)
    await row("Photosynthesis: conspect")

    await openMenu(user, "Photosynthesis: conspect")
    await user.click(await screen.findByRole("menuitem", { name: "Add as source" }))

    await waitFor(() => expect(called).toBe(true))
    await waitFor(() => expect(success).toHaveBeenCalledWith("Added to your sources"))
  })

  it("saves flash cards as a set, then links to the set", async () => {
    // The backend is stateful: the second list request already knows the set.
    const success = spyOn(toast, "success").mockImplementation(() => "")
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)
    await row("Photosynthesis: cards")

    await openMenu(user, "Photosynthesis: cards")
    expect(menuItemNames()).toEqual([
      "Rename",
      "View prompt",
      "Save as flash card set",
      "Download .md",
      "Share",
      "Add to my files",
      "Delete",
    ])
    await user.click(screen.getByRole("menuitem", { name: "Save as flash card set" }))

    await waitFor(() => expect(success).toHaveBeenCalledWith("Flash card set saved"))
    await openMenu(user, "Photosynthesis: cards")
    const open = await screen.findByRole("menuitem", { name: "Open set" })
    expect(open.getAttribute("href")).toMatch(/^\/flashcards\/set\/?\?id=.+/)
  })

  it("links to an existing flash card set", async () => {
    listOf({ ...artifactFlashcards, flashcard_set_id: "set-7" })
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)
    await row("Photosynthesis: cards")

    await openMenu(user, "Photosynthesis: cards")

    const open = await screen.findByRole("menuitem", { name: "Open set" })
    expect(open.getAttribute("href")).toMatch(/^\/flashcards\/set\/?\?id=set-7$/)
    expect(screen.queryByRole("menuitem", { name: "Save as flash card set" })).not.toBeInTheDocument()
  })

  it("cancels a running item", async () => {
    listOf(artifactGenerating)
    const canceled: string[] = []
    server.use(
      http.post(`${ARTIFACTS_URL}/:aid/cancel`, ({ params }) => {
        canceled.push(String(params.aid))
        return HttpResponse.json({
          ...artifactGenerating,
          status: "canceled",
          progress: null,
        })
      }),
    )
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)
    await row("Quiz")

    await openMenu(user, "Quiz")
    expect(menuItemNames()).toEqual(["View prompt", "Cancel creation"])
    await user.click(screen.getByRole("menuitem", { name: "Cancel creation" }))

    await waitFor(() => expect(canceled).toEqual([artifactGenerating.id]))
  })

  it("deletes an item only after the confirmation", async () => {
    const deleted: string[] = []
    server.use(
      http.delete(`${ARTIFACTS_URL}/:aid`, ({ params }) => {
        deleted.push(String(params.aid))
        return new HttpResponse(null, { status: 204 })
      }),
    )
    listOf(artifactReport, artifactMindMap)
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)
    await row("Photosynthesis")

    await openMenu(user, "Photosynthesis")
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }))
    const confirm = await screen.findByRole("alertdialog", {
      name: "Delete this item?",
    })
    expect(deleted).toHaveLength(0)

    await user.click(within(confirm).getByRole("button", { name: "Cancel" }))
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument())
    expect(deleted).toHaveLength(0)

    await openMenu(user, "Photosynthesis")
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }))
    await user.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", {
        name: "Delete",
      }),
    )

    await waitFor(() => expect(deleted).toEqual([artifactMindMap.id]))
    await waitFor(() => expect(screen.queryByText("Photosynthesis", { exact: true })).not.toBeInTheDocument())
    expect(screen.getByText("Photosynthesis: conspect")).toBeInTheDocument()
  })

  it("shows a toast when an action fails", async () => {
    listOf(artifactReport)
    const error = spyOn(toast, "error").mockImplementation(() => "")
    server.use(
      http.post(`${ARTIFACTS_URL}/:aid/save-as-source`, () =>
        HttpResponse.json(
          {
            type: "notebooks/source-limit",
            title: "Limit",
            status: 409,
            message_key: "x",
            params: {},
          },
          {
            status: 409,
            headers: { "Content-Type": "application/problem+json" },
          },
        ),
      ),
    )
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)
    await row("Photosynthesis: conspect")

    await openMenu(user, "Photosynthesis: conspect")
    await user.click(await screen.findByRole("menuitem", { name: "Add as source" }))

    await waitFor(() => expect(error).toHaveBeenCalledWith("This notebook has reached the limit of sources or text."))
  })
})
