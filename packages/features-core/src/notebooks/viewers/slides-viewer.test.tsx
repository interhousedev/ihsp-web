import { describe, expect, it, mock } from "bun:test"
import type { ArtifactDetail, Slide, SlidesPutBody, SlidesReviseBody } from "@ihsp/api"
import { apiUrl, artifactDetailOf, artifactSlides, nbIds, server, slidesContent } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderNotebook } from "../test-support"
import { SlidesViewer } from "./slides-viewer"

allowSlowRenders()

type SlidesDetail = Extract<ArtifactDetail, { kind: "slides" }>

function slidesDetail(): SlidesDetail {
  const detail = artifactDetailOf(artifactSlides)
  if (detail.kind !== "slides") throw new Error("expected a slides artifact")
  return detail
}

function renderViewer() {
  return renderNotebook(<SlidesViewer notebookId={nbIds.notebook} artifact={slidesDetail()} />)
}

const stage = () => within(screen.getByRole("region", { name: "Current slide" }))

/** Captures the body of `PUT …/slides` and answers like the real server (the detail with the sent slides). */
function capturePut() {
  const captured: { body: SlidesPutBody | null } = { body: null }
  server.use(
    http.put(apiUrl(`/v1/notebooks/${nbIds.notebook}/artifacts/${nbIds.slides}/slides`), async ({ request }) => {
      captured.body = (await request.json()) as SlidesPutBody
      return HttpResponse.json({ ...slidesDetail(), content: { ...slidesContent, slides: captured.body.slides } })
    }),
  )
  return captured
}

describe("SlidesViewer: slides", () => {
  it("renders nothing while the deck has no content", () => {
    const detail = { ...slidesDetail(), content: null }
    const { container } = renderNotebook(<SlidesViewer notebookId={nbIds.notebook} artifact={detail} />)

    expect(container).toBeEmptyDOMElement()
  })

  it("shows the first slide, the label and one thumbnail per slide", () => {
    renderViewer()

    expect(stage().getByRole("heading", { name: "Photosynthesis" })).toBeInTheDocument()
    expect(stage().getByText("Grade 10 biology")).toBeInTheDocument()
    expect(screen.getByText("Slide 1 of 6")).toBeInTheDocument()
    const strip = within(screen.getByRole("navigation", { name: "Slides" }))
    expect(strip.getAllByRole("button")).toHaveLength(6)
    expect(strip.getByRole("button", { name: "Slide 1: Photosynthesis" })).toHaveAttribute("aria-current", "true")
    expect(strip.getByRole("button", { name: "Slide 2: Two stages" })).not.toHaveAttribute("aria-current")
  })

  it("renders the bullets, two-column, quote, table and summary layouts", async () => {
    const { user } = renderViewer()
    const next = screen.getByRole("button", { name: "Next slide" })

    await user.click(next)
    expect(stage().getByRole("heading", { name: "Two stages" })).toBeInTheDocument()
    expect(
      stage()
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(["Light reactions", "Calvin cycle"])

    await user.click(next)
    expect(stage().getByRole("heading", { name: "Compare" })).toBeInTheDocument()
    expect(stage().getByRole("heading", { name: "Light reactions" })).toBeInTheDocument()
    expect(stage().getByRole("heading", { name: "Calvin cycle" })).toBeInTheDocument()
    expect(stage().getByText("Need ATP and NADPH")).toBeInTheDocument()

    await user.click(next)
    expect(stage().getByText("Stage two does not need light directly.")).toBeInTheDocument()
    expect(stage().getByText(/Lesson 5/)).toBeInTheDocument()

    await user.click(next)
    expect(stage().getByRole("heading", { name: "Summary table" })).toBeInTheDocument()
    expect(
      stage()
        .getAllByRole("columnheader")
        .map((cell) => cell.textContent),
    ).toEqual(["Stage", "Where"])
    expect(stage().getByRole("cell", { name: "Thylakoid" })).toBeInTheDocument()

    await user.click(next)
    expect(stage().getByRole("heading", { name: "Remember" })).toBeInTheDocument()
    expect(stage().getAllByRole("listitem")).toHaveLength(3)
    expect(next).toBeDisabled()
  })

  it("goes back and forward with the buttons", async () => {
    const { user } = renderViewer()
    const previous = screen.getByRole("button", { name: "Previous slide" })

    expect(previous).toBeDisabled()
    await user.click(screen.getByRole("button", { name: "Next slide" }))
    expect(screen.getByText("Slide 2 of 6")).toBeInTheDocument()
    await user.click(previous)
    expect(screen.getByText("Slide 1 of 6")).toBeInTheDocument()
  })

  it("goes back and forward with the arrow keys", async () => {
    const { user } = renderViewer()
    await user.click(screen.getByRole("button", { name: "Slide 1: Photosynthesis" }))

    await user.keyboard("{ArrowRight}{ArrowRight}")
    expect(screen.getByText("Slide 3 of 6")).toBeInTheDocument()
    await user.keyboard("{ArrowLeft}")
    expect(screen.getByText("Slide 2 of 6")).toBeInTheDocument()
  })

  it("selects a slide from its thumbnail", async () => {
    const { user } = renderViewer()

    await user.click(screen.getByRole("button", { name: "Slide 4: Stage two does not need light directly." }))

    expect(screen.getByText("Slide 4 of 6")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /^Slide 4:/ })).toHaveAttribute("aria-current", "true")
  })

  it("shows the sources of the slide as chips", async () => {
    const { user } = renderViewer()
    expect(screen.queryByRole("button", { name: /^Source 1/ })).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Next slide" }))

    expect(screen.getByRole("button", { name: /Source 1: Biology 10\.pdf/ })).toBeInTheDocument()
  })

  it("toggles the speaker notes with the button and with the N key", async () => {
    const { user } = renderViewer()
    const toggle = screen.getByRole("button", { name: "Speaker notes" })
    expect(screen.queryByText("Welcome. Today: how plants make food.")).not.toBeInTheDocument()

    await user.click(toggle)
    expect(screen.getByText("Welcome. Today: how plants make food.")).toBeInTheDocument()
    expect(toggle).toHaveAttribute("aria-pressed", "true")

    await user.keyboard("n")
    expect(screen.queryByText("Welcome. Today: how plants make food.")).not.toBeInTheDocument()
    await user.keyboard("N")
    expect(screen.getByText("Welcome. Today: how plants make food.")).toBeInTheDocument()
  })

  it("notes follow the slide and say so when there are none", async () => {
    const { user } = renderViewer()
    await user.click(screen.getByRole("button", { name: "Speaker notes" }))

    await user.click(screen.getByRole("button", { name: "Slide 5: Summary table" }))

    expect(screen.getByText("No speaker notes for this slide.")).toBeInTheDocument()
  })

  it("shows the picture idea only in edit mode", async () => {
    const { user } = renderViewer()
    await user.click(screen.getByRole("button", { name: "Next slide" }))
    expect(screen.queryByTestId("visual-hint")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Edit" }))

    expect(screen.getByTestId("visual-hint")).toHaveTextContent("Picture idea: Two-box diagram")
  })
})

const show = () => within(screen.getByRole("dialog", { name: "Slideshow" }))

describe("SlidesViewer: slideshow", () => {
  it("opens full screen on Start slideshow and closes with Esc, returning the focus", async () => {
    const { user } = renderViewer()
    const start = screen.getByRole("button", { name: "Start slideshow" })
    start.focus()

    await user.click(start)
    const show = screen.getByRole("dialog", { name: "Slideshow" })
    expect(within(show).getByRole("heading", { name: "Photosynthesis" })).toBeInTheDocument()
    expect(within(show).getByText("Press Esc to exit")).toBeInTheDocument()

    await user.keyboard("{Escape}")
    expect(screen.queryByRole("dialog", { name: "Slideshow" })).not.toBeInTheDocument()
    expect(start).toHaveFocus()
  })

  it("moves with the arrow keys, Space, Page Down and Page Up", async () => {
    const { user } = renderViewer()
    await user.click(screen.getByRole("button", { name: "Start slideshow" }))

    await user.keyboard("{ArrowRight}")
    expect(show().getByText("Slide 2 of 6")).toBeInTheDocument()
    await user.keyboard(" ")
    expect(show().getByText("Slide 3 of 6")).toBeInTheDocument()
    await user.keyboard("{PageDown}")
    expect(show().getByText("Slide 4 of 6")).toBeInTheDocument()
    await user.keyboard("{PageUp}{ArrowLeft}")
    expect(show().getByText("Slide 2 of 6")).toBeInTheDocument()
  })

  it("shows the notes with N and the slide stays selected after the show", async () => {
    const { user } = renderViewer()
    await user.click(screen.getByRole("button", { name: "Start slideshow" }))
    await user.keyboard("{ArrowRight}n")

    const show = within(screen.getByRole("dialog", { name: "Slideshow" }))
    expect(show.getByText("Name both stages.")).toBeInTheDocument()

    await user.click(show.getByRole("button", { name: "Exit slideshow" }))
    expect(screen.queryByRole("dialog", { name: "Slideshow" })).not.toBeInTheDocument()
    expect(screen.getByText("Slide 2 of 6")).toBeInTheDocument()
  })

  it("asks the browser for full screen when it can", async () => {
    const requestFullscreen = mock(() => Promise.resolve())
    Object.defineProperty(HTMLElement.prototype, "requestFullscreen", { value: requestFullscreen, configurable: true })
    try {
      const { user } = renderViewer()
      await user.click(screen.getByRole("button", { name: "Start slideshow" }))

      expect(requestFullscreen).toHaveBeenCalled()
    } finally {
      Reflect.deleteProperty(HTMLElement.prototype, "requestFullscreen")
    }
  })
})

describe("SlidesViewer: edit mode", () => {
  it("edits the title and the bullets and saves the exact slides with PUT", async () => {
    const captured = capturePut()
    const { user } = renderViewer()
    await user.click(screen.getByRole("button", { name: "Next slide" }))
    await user.click(screen.getByRole("button", { name: "Edit" }))
    expect(screen.getByText("All changes saved")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled()

    const title = screen.getByRole("textbox", { name: "Title" })
    await user.clear(title)
    await user.click(title)
    await user.paste("Light and dark")
    const first = screen.getByRole("textbox", { name: "Bullet 1" })
    await user.clear(first)
    await user.click(first)
    await user.paste("Light-dependent reactions")
    await user.click(screen.getByRole("button", { name: "Add bullet" }))
    await user.click(screen.getByRole("textbox", { name: "Bullet 3" }))
    await user.paste("ATP")

    expect(stage().getByRole("heading", { name: "Light and dark" })).toBeInTheDocument()
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => expect(captured.body).not.toBeNull())
    const expected: Slide[] = slidesContent.slides.map((slide) =>
      slide.id === "s2"
        ? { ...slide, title: "Light and dark", bullets: ["Light-dependent reactions", "Calvin cycle", "ATP"] }
        : slide,
    )
    expect(captured.body).toEqual({ slides: expected })
    await waitFor(() => expect(screen.getByText("All changes saved")).toBeInTheDocument())
  })

  it("drops bullets that were added and left empty", async () => {
    const captured = capturePut()
    const { user } = renderViewer()
    await user.click(screen.getByRole("button", { name: "Next slide" }))
    await user.click(screen.getByRole("button", { name: "Edit" }))

    await user.click(screen.getByRole("button", { name: "Add bullet" }))
    await user.click(screen.getByRole("button", { name: "Remove bullet 1" }))
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => expect(captured.body).not.toBeNull())
    expect(captured.body?.slides[1]?.bullets).toEqual(["Calvin cycle"])
  })

  it("edits the quote, the columns and the notes", async () => {
    const captured = capturePut()
    const { user } = renderViewer()
    await user.click(screen.getByRole("button", { name: "Edit" }))

    await user.click(screen.getByRole("button", { name: "Slide 3: Compare" }))
    const heading = screen.getByRole("textbox", { name: "Left column heading" })
    await user.clear(heading)
    await user.click(heading)
    await user.paste("Light stage")
    await user.click(screen.getByRole("button", { name: "Slide 4: Stage two does not need light directly." }))
    const quote = screen.getByRole("textbox", { name: "Quote" })
    await user.clear(quote)
    await user.click(quote)
    await user.paste("New quote")
    const notes = screen.getByRole("textbox", { name: "Speaker notes" })
    await user.clear(notes)
    await user.click(notes)
    await user.paste("Read slowly")
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => expect(captured.body).not.toBeNull())
    const slides = captured.body?.slides ?? []
    expect(slides[2]?.left).toEqual({ heading: "Light stage", bullets: ["Thylakoids", "Need light"] })
    expect(slides[3]?.quote).toEqual({ text: "New quote", attribution: "Lesson 5" })
    expect(slides[3]?.notes).toBe("Read slowly")
  })

  it("discards the edits", async () => {
    const { user } = renderViewer()
    await user.click(screen.getByRole("button", { name: "Edit" }))
    const title = screen.getByRole("textbox", { name: "Title" })
    await user.click(title)
    await user.paste(" extra")
    expect(stage().getByRole("heading", { name: "Photosynthesis extra" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Discard changes" }))

    expect(stage().getByRole("heading", { name: "Photosynthesis" })).toBeInTheDocument()
    expect(screen.getByText("All changes saved")).toBeInTheDocument()
  })

  it("shows the error of a failed save", async () => {
    server.use(
      http.put(apiUrl(`/v1/notebooks/${nbIds.notebook}/artifacts/${nbIds.slides}/slides`), () =>
        HttpResponse.json({ type: "notebooks/busy", title: "Busy", status: 409 }, { status: 409 }),
      ),
    )
    const { user } = renderViewer()
    await user.click(screen.getByRole("button", { name: "Edit" }))
    await user.click(screen.getByRole("textbox", { name: "Title" }))
    await user.paste("x")

    await user.click(screen.getByRole("button", { name: "Save" }))

    expect(await screen.findByRole("alert")).toBeInTheDocument()
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument()
  })

  it("moves the selected slide with the buttons and sends the new order", async () => {
    const captured = capturePut()
    const { user } = renderViewer()
    await user.click(screen.getByRole("button", { name: "Edit" }))
    expect(screen.getByRole("button", { name: "Move slide up" })).toBeDisabled()

    await user.click(screen.getByRole("button", { name: "Move slide down" }))
    await user.click(screen.getByRole("button", { name: "Move slide down" }))

    const strip = within(screen.getByRole("navigation", { name: "Slides" }))
    expect(strip.getByRole("button", { name: /^Slide 3: Photosynthesis/ })).toHaveAttribute("aria-current", "true")
    expect(screen.getByText("Slide 3 of 6")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Move slide up" }))
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => expect(captured.body).not.toBeNull())
    expect(captured.body?.slides.map((slide) => slide.id)).toEqual(["s2", "s1", "s3", "s4", "s5", "s6"])
  })

  it("deletes a slide after a confirmation and sends the shorter deck", async () => {
    const captured = capturePut()
    const { user } = renderViewer()
    await user.click(screen.getByRole("button", { name: "Edit" }))
    await user.click(screen.getByRole("button", { name: "Slide 5: Summary table" }))

    await user.click(screen.getByRole("button", { name: "Delete slide" }))
    const dialog = await screen.findByRole("alertdialog")
    expect(within(dialog).getByText("Delete this slide?")).toBeInTheDocument()
    await user.click(within(dialog).getByRole("button", { name: "Delete slide" }))

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument())
    expect(screen.getByText("Slide 5 of 5")).toBeInTheDocument()
    expect(stage().getByRole("heading", { name: "Remember" })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => expect(captured.body).not.toBeNull())
    expect(captured.body?.slides.map((slide) => slide.id)).toEqual(["s1", "s2", "s3", "s4", "s6"])
  })

  it("keeps the slide when the confirmation is cancelled", async () => {
    const { user } = renderViewer()
    await user.click(screen.getByRole("button", { name: "Edit" }))

    await user.click(screen.getByRole("button", { name: "Delete slide" }))
    const dialog = await screen.findByRole("alertdialog")
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }))

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument())
    expect(screen.getByText("Slide 1 of 6")).toBeInTheDocument()
  })

  it("offers a drag handle per thumbnail with the keyboard instructions", async () => {
    const { user } = renderViewer()
    await user.click(screen.getByRole("button", { name: "Edit" }))

    const handles = screen.getAllByRole("button", { name: /^Reorder slide/ })
    expect(handles).toHaveLength(6)
    expect(handles[0]).toHaveAttribute("aria-roledescription", "sortable")
    expect(handles[0]).toHaveAttribute("aria-describedby")
  })

  it("does not move between slides with the arrow keys while typing", async () => {
    const { user } = renderViewer()
    await user.click(screen.getByRole("button", { name: "Edit" }))
    await user.click(screen.getByRole("textbox", { name: "Title" }))

    await user.keyboard("{ArrowRight}n")

    expect(screen.getByText("Slide 1 of 6")).toBeInTheDocument()
    expect(screen.queryByRole("region", { name: "Speaker notes" })).not.toBeInTheDocument()
  })
})

describe("SlidesViewer: revise mode", () => {
  it("sends the instructions of the slides that have one and offers to open the new deck", async () => {
    const captured: { body: SlidesReviseBody | null } = { body: null }
    server.use(
      http.post(
        apiUrl(`/v1/notebooks/${nbIds.notebook}/artifacts/${nbIds.slides}/slides/revise`),
        async ({ request }) => {
          captured.body = (await request.json()) as SlidesReviseBody
          return HttpResponse.json(
            {
              ...artifactSlides,
              id: "0193aaaa-0000-7000-8000-000000000001",
              status: "queued",
              parent_id: nbIds.slides,
            },
            { status: 202 },
          )
        },
      ),
    )
    const { user, actions } = renderViewer()
    await user.click(screen.getByRole("button", { name: "Revise" }))
    expect(screen.getByText("No changes yet.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Generate revised deck" })).toBeDisabled()

    await user.click(screen.getByRole("textbox", { name: "What to change on slide 1" }))
    await user.paste("Make it shorter")
    await user.click(screen.getByRole("button", { name: "Slide 3: Compare" }))
    await user.click(screen.getByRole("textbox", { name: "What to change on slide 3" }))
    await user.paste("  Add an example  ")

    const pending = within(screen.getByRole("list", { name: "Pending changes" }))
    expect(pending.getAllByRole("listitem")).toHaveLength(2)
    expect(pending.getByText("Make it shorter")).toBeInTheDocument()
    expect(
      within(screen.getByRole("navigation", { name: "Slides" })).getByRole("button", {
        name: /^Slide 1: Photosynthesis/,
      }),
    ).toHaveTextContent("has a pending change")

    await user.click(screen.getByRole("button", { name: "Generate revised deck" }))

    await waitFor(() => expect(captured.body).not.toBeNull())
    expect(captured.body).toEqual({
      changes: [
        { slide_id: "s1", instruction: "Make it shorter" },
        { slide_id: "s3", instruction: "Add an example" },
      ],
    })
    const status = await screen.findByText("The revised deck is being generated. It will appear in Studio.")
    expect(status).toBeInTheDocument()
    expect(screen.getByText("No changes yet.")).toBeInTheDocument()
    await user.click(within(status.parentElement as HTMLElement).getByRole("button", { name: "Open" }))
    expect(actions.openArtifact).toHaveBeenCalledWith("0193aaaa-0000-7000-8000-000000000001")
  })

  it("removes a change from the pending list", async () => {
    const { user } = renderViewer()
    await user.click(screen.getByRole("button", { name: "Revise" }))
    await user.click(screen.getByRole("textbox", { name: "What to change on slide 1" }))
    await user.paste("Shorter")

    await user.click(screen.getByRole("button", { name: "Remove the change for slide 1" }))

    expect(screen.getByText("No changes yet.")).toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: "What to change on slide 1" })).toHaveValue("")
  })

  it("waits for unsaved edits before it revises", async () => {
    const { user } = renderViewer()
    await user.click(screen.getByRole("button", { name: "Edit" }))
    await user.click(screen.getByRole("textbox", { name: "Title" }))
    await user.paste("x")
    await user.click(screen.getByRole("button", { name: "Revise" }))
    await user.click(screen.getByRole("textbox", { name: "What to change on slide 1" }))
    await user.paste("Shorter")

    expect(screen.getByText("Save or discard your edits first.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Generate revised deck" })).toBeDisabled()
  })

  it("shows the error of a failed request", async () => {
    server.use(
      http.post(apiUrl(`/v1/notebooks/${nbIds.notebook}/artifacts/${nbIds.slides}/slides/revise`), () =>
        HttpResponse.json({ type: "notebooks/busy", title: "Busy", status: 409 }, { status: 409 }),
      ),
    )
    const { user } = renderViewer()
    await user.click(screen.getByRole("button", { name: "Revise" }))
    await user.click(screen.getByRole("textbox", { name: "What to change on slide 1" }))
    await user.paste("Shorter")

    await user.click(screen.getByRole("button", { name: "Generate revised deck" }))

    expect(await screen.findByRole("alert")).toBeInTheDocument()
  })
})

describe("SlidesViewer: print and copy", () => {
  it("prints with the browser dialog", async () => {
    const print = mock(() => undefined)
    window.print = print
    const { user } = renderViewer()

    await user.click(screen.getByRole("button", { name: "Print / PDF" }))

    expect(print).toHaveBeenCalledTimes(1)
  })

  it("keeps a page-break stack with every slide that is hidden on screen and shown on paper", () => {
    renderViewer()

    const stack = document.body.querySelector("[data-slide-print]")
    expect(stack).not.toBeNull()
    expect(stack).toHaveAttribute("aria-hidden", "true")
    expect(stack).toHaveClass("hidden", "print:block")
    expect(stack?.querySelectorAll(".break-after-page")).toHaveLength(6)
    expect(stack?.querySelector("style")?.textContent).toContain("@page")
  })

  it("copies the outline", async () => {
    const { user } = renderViewer()

    await user.click(screen.getByRole("button", { name: "Copy outline" }))

    await waitFor(async () => expect(await navigator.clipboard.readText()).toContain("2. Two stages"))
    const text = await navigator.clipboard.readText()
    expect(text.startsWith("Photosynthesis\nGrade 10 biology")).toBe(true)
    expect(text).toContain("2. Two stages\n   - Light reactions")
  })

  it("does not react to a plain key press outside the deck", () => {
    renderViewer()

    fireEvent.keyDown(document.body, { key: "ArrowRight" })

    expect(screen.getByText("Slide 1 of 6")).toBeInTheDocument()
  })
})
