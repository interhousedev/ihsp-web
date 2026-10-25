import { afterEach, describe, expect, it } from "bun:test"
import type { ArtifactCreate, ArtifactItem, FileItem } from "@ihsp/api"
import {
  apiUrl,
  artifactGenerating,
  dropdownLabels,
  filePdf,
  nbIds,
  notebookDetail,
  notebookUsageLimitReached,
  selectDropdownValue,
  server,
} from "@ihsp/test-utils"
import { act, screen, waitFor, within } from "@testing-library/react"
import type { UserEvent } from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderNotebook } from "../test-support"
import { StudioPanel } from "./studio-panel"

allowSlowRenders()

const ARTIFACTS_URL = apiUrl(`/v1/notebooks/${nbIds.notebook}/artifacts`)

function captureCreates(): ArtifactCreate[] {
  const bodies: ArtifactCreate[] = []
  server.use(
    http.post(ARTIFACTS_URL, async ({ request }) => {
      const body = (await request.json()) as ArtifactCreate
      bodies.push(body)
      const item: ArtifactItem = {
        ...artifactGenerating,
        id: `new-${bodies.length}`,
        kind: body.kind,
        status: "queued",
      }
      return HttpResponse.json(item, { status: 202 })
    }),
  )
  return bodies
}

/** Clicks the pencil of a tile and returns the form dialog. */
async function openForm(user: UserEvent, tileLabel: string): Promise<HTMLElement> {
  await user.click(await screen.findByRole("button", { name: `Customize ${tileLabel}` }))
  return screen.findByRole("dialog", { name: `Customize ${tileLabel}` })
}

function group(dialog: HTMLElement, name: string): HTMLElement {
  return within(dialog).getByRole("group", { name })
}

async function generate(user: UserEvent, dialog: HTMLElement): Promise<void> {
  await user.click(within(dialog).getByRole("button", { name: "Generate" }))
}

const originalWidth = window.innerWidth
afterEach(() => {
  window.innerWidth = originalWidth
})

describe("Customize dialogs: one form per kind", () => {
  it("conspect: detail, style, language and focus end up in the request", async () => {
    const bodies = captureCreates()
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)
    const dialog = await openForm(user, "Conspect")

    await user.click(within(group(dialog, "Detail")).getByRole("button", { name: "Long" }))
    await user.click(
      within(group(dialog, "Style")).getByRole("button", {
        name: "Cornell notes",
      }),
    )
    await selectDropdownValue(user, within(dialog).getByRole("combobox", { name: "Language" }), "ru")
    await user.click(
      within(dialog).getByRole("textbox", {
        name: "What should it focus on? (optional)",
      }),
    )
    await user.paste("Only the Calvin cycle")
    await generate(user, dialog)

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toEqual({
      kind: "report",
      options: {
        format: "conspect",
        detail: "long",
        style: "cornell",
        language: "ru",
      },
      prompt: "Only the Calvin cycle",
    })
  })

  it("mind map: overview or detailed", async () => {
    const bodies = captureCreates()
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)
    const dialog = await openForm(user, "Mind map")

    expect(within(group(dialog, "Detail")).getByRole("button", { name: "Overview" })).toHaveAttribute(
      "aria-pressed",
      "true",
    )
    await user.click(within(group(dialog, "Detail")).getByRole("button", { name: "Detailed" }))
    await generate(user, dialog)

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toEqual({
      kind: "mind_map",
      options: { detail: "detailed" },
    })
  })

  it("flash cards: number and difficulty", async () => {
    const bodies = captureCreates()
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)
    const dialog = await openForm(user, "Flash cards")

    await user.click(within(group(dialog, "Number")).getByRole("button", { name: "More" }))
    await user.click(within(group(dialog, "Difficulty")).getByRole("button", { name: "Hard" }))
    await generate(user, dialog)

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toEqual({
      kind: "flashcards",
      options: { count: "more", difficulty: "hard", mode: "auto" },
    })
  })

  it("quiz: number, difficulty and question types", async () => {
    const bodies = captureCreates()
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)
    const dialog = await openForm(user, "Quiz")

    await user.click(within(group(dialog, "Number")).getByRole("button", { name: "Fewer" }))
    await user.click(within(group(dialog, "Difficulty")).getByRole("button", { name: "Easy" }))
    await user.click(within(dialog).getByRole("checkbox", { name: "Multiple choice" }))
    await generate(user, dialog)

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toEqual({
      kind: "quiz",
      options: {
        count: "fewer",
        difficulty: "easy",
        mode: "auto",
        types: ["single", "true_false"],
      },
    })
  })

  it("flash cards: a custom number of cards is sent exactly", async () => {
    const bodies = captureCreates()
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)
    const dialog = await openForm(user, "Flash cards")

    await user.click(within(group(dialog, "Number")).getByRole("button", { name: "Custom" }))
    const input = within(dialog).getByRole("spinbutton", { name: "Number of cards" })
    await user.clear(input)
    await user.type(input, "42")
    await generate(user, dialog)

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toEqual({
      kind: "flashcards",
      options: { count: 42, difficulty: "medium", mode: "auto" },
    })
  })

  it("flash cards: a custom number outside 1 to 150 says so and blocks Generate", async () => {
    const bodies = captureCreates()
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)
    const dialog = await openForm(user, "Flash cards")

    await user.click(within(group(dialog, "Number")).getByRole("button", { name: "Custom" }))
    const input = within(dialog).getByRole("spinbutton", { name: "Number of cards" })
    expect(input).toHaveAttribute("min", "1")
    expect(input).toHaveAttribute("max", "150")
    await user.clear(input)
    await user.type(input, "200")

    expect(within(dialog).getByRole("alert")).toHaveTextContent("Enter a number from 1 to 150")
    expect(within(dialog).getByRole("button", { name: "Generate" })).toBeDisabled()

    await user.clear(input)
    await user.type(input, "150")
    expect(within(dialog).queryByRole("alert")).toBeNull()
    expect(within(dialog).getByRole("button", { name: "Generate" })).toBeEnabled()
    expect(bodies).toHaveLength(0)
  })

  it("quiz: a custom number of questions is sent exactly, up to 100", async () => {
    const bodies = captureCreates()
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)
    const dialog = await openForm(user, "Quiz")

    await user.click(within(group(dialog, "Number")).getByRole("button", { name: "Custom" }))
    const input = within(dialog).getByRole("spinbutton", { name: "Number of questions" })
    expect(input).toHaveAttribute("max", "100")
    await user.clear(input)
    await user.type(input, "100")
    await generate(user, dialog)

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toMatchObject({ kind: "quiz", options: { count: 100 } })
  })

  it("quiz: needs at least one question type", async () => {
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)
    const dialog = await openForm(user, "Quiz")

    for (const name of ["Single choice", "Multiple choice", "True / false"]) {
      await user.click(within(dialog).getByRole("checkbox", { name }))
    }

    expect(within(dialog).getByRole("alert")).toHaveTextContent("Choose at least one type")
    expect(within(dialog).getByRole("button", { name: "Generate" })).toBeDisabled()

    await user.click(within(dialog).getByRole("checkbox", { name: "True / false" }))
    expect(within(dialog).getByRole("button", { name: "Generate" })).toBeEnabled()
  })

  it("data table: the maximum number of rows stays between 10 and 40", async () => {
    const bodies = captureCreates()
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)
    const dialog = await openForm(user, "Data table")

    const rows = within(dialog).getByRole("spinbutton", {
      name: "Maximum rows",
    })
    expect(rows).toHaveValue(25)
    await user.clear(rows)
    await user.type(rows, "99")
    await user.click(
      within(dialog).getByRole("textbox", {
        name: "What should it focus on? (optional)",
      }),
    )
    await user.paste("Columns: year, event, place")
    await generate(user, dialog)

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toEqual({
      kind: "data_table",
      options: { max_rows: 40 },
      prompt: "Columns: year, event, place",
    })
  })

  it("PLAN slide deck: format and length ask for an outline first, which opens in the plan panel", async () => {
    const bodies = captureCreates()
    const plans: unknown[] = []
    server.use(
      http.post(apiUrl(`/v1/notebooks/${nbIds.notebook}/presentation-plans`), async ({ request }) => {
        plans.push(await request.json())
        return HttpResponse.json(
          {
            id: "plan-1",
            notebook_id: nbIds.notebook,
            title: "Photosynthesis",
            slides: [{ title: "Photosynthesis", bullets: ["Light"] }],
            status: "draft",
            max_slides: 18,
            over_limit: false,
            artifact_id: null,
            created_at: "2026-10-14T09:00:00Z",
            updated_at: "2026-10-14T09:00:00Z",
          },
          { status: 201 },
        )
      }),
    )
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)
    const dialog = await openForm(user, "Slide deck")

    await user.click(
      within(group(dialog, "Format")).getByRole("button", {
        name: "Detailed deck",
      }),
    )
    await user.click(within(group(dialog, "Length")).getByRole("button", { name: "Long" }))
    await user.click(within(dialog).getByRole("button", { name: "Plan the slides" }))

    await waitFor(() => expect(plans).toHaveLength(1))
    expect(plans[0]).toMatchObject({ prompt: null, slide_count: 16, format: "detailed" })
    expect(bodies).toHaveLength(0)
    expect(await screen.findByRole("dialog", { name: "Presentation plan" })).toBeInTheDocument()
  })

  it("infographic: orientation, detail and one of five styles", async () => {
    const bodies = captureCreates()
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)
    const dialog = await openForm(user, "Infographic")

    const styles = within(group(dialog, "Style")).getAllByRole("button")
    expect(styles.map((button) => button.textContent)).toEqual(["Clean", "Sketch", "Bento", "Scientific", "Playful"])
    await user.click(
      within(group(dialog, "Orientation")).getByRole("button", {
        name: "Landscape",
      }),
    )
    await user.click(within(group(dialog, "Detail")).getByRole("button", { name: "Concise" }))
    await user.click(within(group(dialog, "Style")).getByRole("button", { name: "Playful" }))
    await generate(user, dialog)

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toEqual({
      kind: "infographic",
      options: {
        orientation: "landscape",
        detail: "concise",
        style: "playful",
      },
    })
  })

  it("keeps the chosen button pressed and never switches the last one off", async () => {
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)
    const dialog = await openForm(user, "Flash cards")
    const standard = within(group(dialog, "Number")).getByRole("button", {
      name: "Standard",
    })

    await user.click(standard)

    expect(standard).toHaveAttribute("aria-pressed", "true")
  })
})

describe("Customize dialogs: common fields", () => {
  it("leaves the language out for Auto and sends an explicit one", async () => {
    const bodies = captureCreates()
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)
    const dialog = await openForm(user, "Mind map")
    const language = within(dialog).getByRole("combobox", { name: "Language" })

    expect(language).toHaveAttribute("data-value", "auto")
    expect(await dropdownLabels(user, language)).toEqual(["Auto", "Oʻzbekcha", "Русский", "English"])
    await generate(user, dialog)
    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toEqual({
      kind: "mind_map",
      options: { detail: "overview" },
    })

    const again = await openForm(user, "Mind map")
    await selectDropdownValue(user, within(again).getByRole("combobox", { name: "Language" }), "uz")
    await generate(user, again)
    await waitFor(() => expect(bodies).toHaveLength(2))
    expect(bodies[1]).toEqual({
      kind: "mind_map",
      options: { detail: "overview", language: "uz" },
    })
  })

  it("limits the focus text to 1000 characters and counts them", async () => {
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)
    const dialog = await openForm(user, "Quiz")
    const focus = within(dialog).getByRole("textbox", {
      name: "What should it focus on? (optional)",
    })

    expect(focus).toHaveAttribute("maxlength", "1000")
    expect(within(dialog).getByText("0 / 1000")).toBeInTheDocument()
    await user.click(focus)
    await user.paste("Photosynthesis")
    expect(within(dialog).getByText("14 / 1000")).toBeInTheDocument()
  })

  it("opens from a click on the tile itself, with the sources of the pane ticked", async () => {
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)

    await user.click(await screen.findByRole("button", { name: "Quiz" }))
    const dialog = await screen.findByRole("dialog", { name: "Customize Quiz" })

    expect(await within(dialog).findByText("3 of 3 selected")).toBeInTheDocument()
    const list = within(dialog).getByRole("list", { name: "Sources to use" })
    for (const title of ["Biology 10.pdf", "Lesson 5: Photosynthesis", "My notes"]) {
      expect(within(list).getByRole("checkbox", { name: title })).toBeChecked()
    }
  })

  it("filters the source list by the search text", async () => {
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)
    const dialog = await openForm(user, "Quiz")
    await within(dialog).findByText("3 of 3 selected")

    await user.click(within(dialog).getByRole("searchbox", { name: "Search sources" }))
    await user.paste("photo")

    const list = within(dialog).getByRole("list", { name: "Sources to use" })
    expect(within(list).getAllByRole("checkbox")).toHaveLength(1)
    expect(within(list).getByRole("checkbox", { name: "Lesson 5: Photosynthesis" })).toBeInTheDocument()
  })

  it("ticks sources one by one or all at once, and the request carries the ticked ids", async () => {
    const bodies = captureCreates()
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)
    const dialog = await openForm(user, "Quiz")
    await within(dialog).findByText("3 of 3 selected")

    await user.click(within(dialog).getByRole("button", { name: "Select none" }))
    expect(within(dialog).getByText("0 of 3 selected")).toBeInTheDocument()
    expect(
      within(dialog).getByText("No sources selected — the answer will not rely on your materials"),
    ).toBeInTheDocument()

    await user.click(within(dialog).getByRole("checkbox", { name: "My notes" }))
    expect(within(dialog).getByText("1 of 3 selected")).toBeInTheDocument()
    await generate(user, dialog)

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]?.options).toMatchObject({ source_ids: [nbIds.sourceText] })

    const again = await openForm(user, "Quiz")
    await within(again).findByText("3 of 3 selected")
    await user.click(within(again).getByRole("button", { name: "Select none" }))
    await user.click(within(again).getByRole("button", { name: "Select all" }))
    expect(within(again).getByText("3 of 3 selected")).toBeInTheDocument()
    await generate(user, again)

    // The same set as the pane: the request is the plain one of the tile.
    await waitFor(() => expect(bodies).toHaveLength(2))
    expect(bodies[1]?.options).not.toHaveProperty("source_ids")
  })

  it("adds a file from the picker as a source and ticks it", async () => {
    const extra: FileItem = { ...filePdf, id: "00000000-0000-4000-8000-000000000299", name: "chapter-3.pdf" }
    server.use(http.get(apiUrl("/v1/me/files"), () => HttpResponse.json({ items: [extra], next_cursor: null })))
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)
    const dialog = await openForm(user, "Quiz")
    await within(dialog).findByText("3 of 3 selected")

    await user.click(within(dialog).getByRole("button", { name: "Add sources" }))
    await user.click(await screen.findByRole("button", { name: "chapter-3.pdf" }))
    await user.click(screen.getByRole("button", { name: "Select" }))

    expect(await within(dialog).findByText("4 of 4 selected")).toBeInTheDocument()
    const list = within(dialog).getByRole("list", { name: "Sources to use" })
    expect(within(list).getByRole("checkbox", { name: "File" })).toBeChecked()
    expect(within(dialog).getByText("1 source is still being read and will be skipped")).toBeInTheDocument()
    expect(within(dialog).getByRole("button", { name: "Generate" })).toBeEnabled()
  })

  it("starts from the defaults every time it opens: closing keeps nothing", async () => {
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)
    const first = await openForm(user, "Flash cards")
    await user.click(within(group(first, "Number")).getByRole("button", { name: "More" }))
    await user.click(
      within(first).getByRole("textbox", {
        name: "What should it focus on? (optional)",
      }),
    )
    await user.paste("Dates only")
    await user.click(within(first).getByRole("button", { name: "Cancel" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())

    const second = await openForm(user, "Flash cards")

    expect(within(group(second, "Number")).getByRole("button", { name: "Standard" })).toHaveAttribute(
      "aria-pressed",
      "true",
    )
    expect(
      within(second).getByRole("textbox", {
        name: "What should it focus on? (optional)",
      }),
    ).toHaveValue("")
  })

  it("sends nothing when the dialog is cancelled", async () => {
    const bodies = captureCreates()
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)
    const dialog = await openForm(user, "Quiz")

    await user.click(within(dialog).getByRole("button", { name: "Cancel" }))

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(bodies).toHaveLength(0)
  })

  it("keeps the dialog open and shows the error when starting fails", async () => {
    server.use(
      http.post(ARTIFACTS_URL, () =>
        HttpResponse.json(
          {
            type: "notebooks/quota-exceeded",
            title: "Quota",
            status: 429,
            message_key: "notebooks-quota-exceeded",
            params: {
              kind: "quiz",
              limit: 20,
              resets_at: "2026-10-08T00:00:00Z",
            },
          },
          {
            status: 429,
            headers: { "Content-Type": "application/problem+json" },
          },
        ),
      ),
    )
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)
    const dialog = await openForm(user, "Quiz")

    await generate(user, dialog)

    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Daily limit for “Quiz” reached.")
    expect(screen.getByRole("dialog", { name: "Customize Quiz" })).toBeInTheDocument()
  })

  it("can generate without a ticked source: a warning, the pane is cleared and the plain request goes out", async () => {
    const bodies = captureCreates()
    const selects: unknown[] = []
    server.use(
      http.post(apiUrl(`/v1/notebooks/${nbIds.notebook}/sources/select`), async ({ request }) => {
        selects.push(await request.json())
        return HttpResponse.json([])
      }),
    )
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)
    const dialog = await openForm(user, "Quiz")
    await within(dialog).findByText("3 of 3 selected")

    await user.click(within(dialog).getByRole("button", { name: "Select none" }))
    expect(
      within(dialog).getByText("No sources selected — the answer will not rely on your materials"),
    ).toBeInTheDocument()
    expect(within(dialog).getByRole("button", { name: "Generate" })).toBeEnabled()
    await generate(user, dialog)

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(selects).toEqual([{ selected: false }])
    expect(bodies[0]?.options).not.toHaveProperty("source_ids")
  })

  it("cannot generate while the browser is offline", async () => {
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)
    const dialog = await openForm(user, "Quiz")
    expect(within(dialog).getByRole("button", { name: "Generate" })).toBeEnabled()

    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      get: () => false,
    })
    act(() => {
      window.dispatchEvent(new Event("offline"))
    })

    await waitFor(() => expect(within(dialog).getByRole("button", { name: "Generate" })).toBeDisabled())
    expect(within(dialog).getByText("You are offline")).toBeInTheDocument()
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      get: () => true,
    })
    act(() => {
      window.dispatchEvent(new Event("online"))
    })
  })

  it("cannot generate when the budget is used up and says when it resets", async () => {
    server.use(http.get(apiUrl("/v1/notebooks/usage"), () => HttpResponse.json(notebookUsageLimitReached)))
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)
    const dialog = await openForm(user, "Quiz")

    expect(await within(dialog).findByText(/Daily limit reached, resets at \d\d:\d\d\./)).toBeInTheDocument()
    expect(within(dialog).getByRole("button", { name: "Generate" })).toBeDisabled()
  })

  it("opens the report picker from the pencil of the Reports tile", async () => {
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)

    await user.click(await screen.findByRole("button", { name: "Customize Reports" }))

    expect(await screen.findByRole("dialog", { name: "Choose a report format" })).toBeInTheDocument()
  })

  it("is a bottom sheet on a phone and works the same", async () => {
    window.innerWidth = 390
    const bodies = captureCreates()
    const { user } = renderNotebook(<StudioPanel notebook={notebookDetail} />)
    const dialog = await openForm(user, "Flash cards")

    expect(dialog.getAttribute("data-slot")).toContain("drawer")
    await user.click(within(group(dialog, "Difficulty")).getByRole("button", { name: "Easy" }))
    await generate(user, dialog)

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toEqual({
      kind: "flashcards",
      options: { count: "standard", difficulty: "easy", mode: "auto" },
    })
  })
})
