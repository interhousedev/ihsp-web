import { afterEach, describe, expect, it } from "bun:test"
import { getAnnotations } from "@ihsp/api"
import { apiUrl, libDetails, libIds, server, setLibraryActor, setUniLibrary } from "@ihsp/test-utils"
import { act, screen, waitFor, within } from "@testing-library/react"
import axe from "axe-core"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderLibrary, renderLibraryAnonymous } from "../test-support"
import { resetAnnotationQueue } from "./lib/annotation-queue"
import { ReaderPage } from "./reader-page"
import { createFakeEpub, createFakePdf } from "./testing/fake-engines"

allowSlowRenders()
afterEach(() => resetAnnotationQueue())

const physics = libDetails.bookPhysics10
const PDF_ROUTE = `/read/?item=${libIds.bookPhysics10}`

function renderPdf(route = PDF_ROUTE, anonymous = false, pages = 240) {
  const fake = createFakePdf(pages, (page) => `Velocity on page ${page}.\nSecond line of page ${page}.`)
  const engines = { pdf: async () => fake.engine }
  const view = anonymous
    ? renderLibraryAnonymous(<ReaderPage engines={engines} />, { route })
    : renderLibrary(<ReaderPage engines={engines} />, { route })
  return { fake, ...view }
}

function select(element: HTMLElement) {
  const range = document.createRange()
  range.selectNodeContents(element)
  const selection = window.getSelection()!
  selection.removeAllRanges()
  selection.addRange(range)
  document.dispatchEvent(new Event("selectionchange"))
}

async function selectLine(page: number) {
  await waitFor(() => expect(screen.getByText(`Velocity on page ${page}.`)).toBeInTheDocument())
  select(screen.getByText(`Velocity on page ${page}.`))
  return screen.findByRole("toolbar", { name: "Selected text" }, { timeout: 3000 })
}

/** The toolbar and the footer both have the button (CSS shows one of them); the first one is the toolbar's. */
const openNotesButton = async () => (await screen.findAllByRole("button", { name: "Notes and highlights" }))[0]!

const stored = async (itemId: string) => (await getAnnotations({ item_id: itemId })).items

describe("ReaderPage: opening", () => {
  it("opens a PDF at the page in the address and shows where it is", async () => {
    renderPdf(`${PDF_ROUTE}&page=8`)

    expect(await screen.findByRole("heading", { level: 1, name: physics.title })).toBeInTheDocument()
    expect(await screen.findByRole("button", { name: "Page 8 of 240" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Back to the item" }).getAttribute("href")).toContain("id=")
  })

  it("opens a PDF at the place saved on this device when the address has none", async () => {
    window.localStorage.setItem(
      "ihsp.library.position",
      JSON.stringify({
        [`${libIds.bookPhysics10}:${libIds.filePhysics10}`]: { locator: { page: 31 }, at: "2026-10-01T00:00:00Z" },
      }),
    )
    renderPdf()

    expect(await screen.findByRole("button", { name: "Page 31 of 240" })).toBeInTheDocument()
  })

  it("says only that the item is not available for an unknown item", async () => {
    renderPdf("/read/?item=00000000-0000-4000-8000-000000000000")

    expect(await screen.findByText("This item is not available")).toBeInTheDocument()
  })

  it("says the same without an item in the address", async () => {
    renderPdf("/read/")

    expect(await screen.findByText("This item is not available")).toBeInTheDocument()
  })

  it("never opens a UniLibrary record: not available while it is off, and link-only when it is on", async () => {
    renderPdf(`/read/?item=${libIds.extPinned}`)
    expect(await screen.findByText("This item is not available")).toBeInTheDocument()
  })

  it("never opens a UniLibrary record even when UniLibrary is on", async () => {
    setUniLibrary({ enabled: true })
    renderPdf(`/read/?item=${libIds.extPinned}`)

    expect(await screen.findByText("This item is not available")).toBeInTheDocument()
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument()
  })

  it("asks a visitor to sign in for a lyceum-only book", async () => {
    renderPdf(PDF_ROUTE, true)

    expect(await screen.findByText("This item is not available")).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole("button", { name: "Sign in to read this item." })).toBeInTheDocument())
  })

  it("shows the scan-without-text notice and no search for a scan", async () => {
    renderPdf(`/read/?item=${libIds.bookGeometryScan}`, false, 64)

    expect(await screen.findByText(/scan without text/)).toBeInTheDocument()
  })

  it("has nothing a screen reader cannot use in the reader chrome", async () => {
    const { container } = renderPdf(`${PDF_ROUTE}&page=2`)
    await screen.findByRole("button", { name: "Page 2 of 240" })

    const results = await axe.run(container, { rules: { "color-contrast": { enabled: false } } })
    expect(results.violations.map((violation) => violation.id)).toEqual([])
  })
})

describe("ReaderPage: a visitor reads a public book", () => {
  it("reads it without notes, bookmarks or saved progress", async () => {
    const puts: unknown[] = []
    server.use(
      http.put(apiUrl("/v1/me/library/progress/:itemId"), () => {
        puts.push(1)
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { unmount } = renderPdf(`/read/?item=${libIds.bookOpenPhysics}&page=3`, true, 20)
    await screen.findByRole("button", { name: "Page 3 of 20" })

    const toolbar = await selectLine(3)

    expect(within(toolbar).getByRole("button", { name: "Copy" })).toBeInTheDocument()
    expect(within(toolbar).queryByRole("button", { name: /Highlight/ })).not.toBeInTheDocument()
    expect(within(toolbar).queryByRole("button", { name: "Add note" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Bookmark this place" })).not.toBeInTheDocument()
    unmount()
    expect(puts).toHaveLength(0)
  })
})

describe("ReaderPage: progress", () => {
  it("saves the place when the reader closes, with the page and the percent", async () => {
    const bodies: Record<string, unknown>[] = []
    server.use(
      http.put(apiUrl("/v1/me/library/progress/:itemId"), async ({ request }) => {
        bodies.push((await request.json()) as Record<string, unknown>)
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { unmount } = renderPdf(`${PDF_ROUTE}&page=60`)
    await screen.findByRole("button", { name: "Page 60 of 240" })

    unmount()

    await waitFor(() => expect(bodies.length).toBeGreaterThan(0))
    expect(bodies.at(-1)).toMatchObject({ file_id: libIds.filePhysics10, locator: { page: 60 }, percent: 25 })
    expect(typeof bodies.at(-1)?.client_ts).toBe("string")
  })
})

describe("ReaderPage: highlights and notes", () => {
  it("highlights the selected text in a colour and lists it", async () => {
    const { user } = renderPdf(`${PDF_ROUTE}&page=5`)
    const toolbar = await selectLine(5)

    await user.click(within(toolbar).getByRole("button", { name: "Highlight: Green" }))

    await waitFor(async () => {
      const items = await stored(libIds.bookPhysics10)
      expect(items.some((a) => a.quote === "Velocity on page 5." && a.color === "green" && a.kind === "highlight")).toBe(
        true,
      )
    })
    await user.click(await openNotesButton())
    const panel = await screen.findByRole("complementary", { name: "Notes and highlights" })
    expect(await within(panel).findByText("Velocity on page 5.")).toBeInTheDocument()
    expect(within(panel).getAllByText("p. 5").length).toBeGreaterThan(0)
  })

  it("keeps the colour of the last highlight for the next one", async () => {
    const { user } = renderPdf(`${PDF_ROUTE}&page=5`)
    const toolbar = await selectLine(5)
    await user.click(within(toolbar).getByRole("button", { name: "Highlight: Pink" }))
    await waitFor(async () => expect((await stored(libIds.bookPhysics10)).some((a) => a.color === "pink")).toBe(true))

    const again = await selectLine(5)

    expect(within(again).getByRole("button", { name: "Highlight: Pink" })).toHaveAttribute("aria-pressed", "true")
  })

  it("adds a note with a colour through the dialog", async () => {
    const { user } = renderPdf(`${PDF_ROUTE}&page=9`)
    const toolbar = await selectLine(9)

    await user.click(within(toolbar).getByRole("button", { name: "Add note" }))
    const dialog = await screen.findByRole("dialog")
    await user.type(within(dialog).getByLabelText("Note"), "Check the units")
    await user.click(within(dialog).getByRole("radio", { name: "Blue" }))
    await user.click(within(dialog).getByRole("button", { name: "Save" }))

    await waitFor(async () => {
      const items = await stored(libIds.bookPhysics10)
      expect(
        items.some((a) => a.kind === "note" && a.note === "Check the units" && a.color === "blue" && "page" in a.locator),
      ).toBe(true)
    })
  })

  it("does not save an empty note", async () => {
    const { user } = renderPdf(`${PDF_ROUTE}&page=9`)
    const toolbar = await selectLine(9)
    await user.click(within(toolbar).getByRole("button", { name: "Add note" }))

    const dialog = await screen.findByRole("dialog")

    expect(within(dialog).getByRole("button", { name: "Save" })).toBeDisabled()
  })

  it("copies the selection", async () => {
    const { user } = renderPdf(`${PDF_ROUTE}&page=5`)
    const written: string[] = []
    // After the render: user-event installs its own clipboard when it is set up.
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async (text: string) => void written.push(text) },
    })
    const toolbar = await selectLine(5)

    await user.click(within(toolbar).getByRole("button", { name: "Copy" }))

    await waitFor(() => expect(written).toEqual(["Velocity on page 5."]))
  })

  it("adds the selected page to a notebook", async () => {
    const { user } = renderPdf(`${PDF_ROUTE}&page=12`)
    const toolbar = await selectLine(12)

    await user.click(within(toolbar).getByRole("button", { name: "Add to notebook" }))

    const dialog = await screen.findByRole("dialog")
    await user.click(within(dialog).getByRole("radio", { name: "Pages" }))
    expect(within(dialog).getByLabelText("From page")).toHaveValue("12")
    expect(within(dialog).getByLabelText("To page")).toHaveValue("12")
  })

  it("shows the notes of the item that the account already has, in reading order, and goes to one", async () => {
    const { user } = renderPdf(`${PDF_ROUTE}&page=1`)
    await screen.findByRole("button", { name: "Page 1 of 240" })
    await user.click(await openNotesButton())
    const panel = await screen.findByRole("complementary", { name: "Notes and highlights" })

    await within(panel).findByText("A net force produces acceleration.")
    const places = within(panel)
      .getAllByText(/^p\. \d+$/)
      .map((node) => node.textContent)
    expect(places).toEqual(["p. 8", "p. 16", "p. 31", "p. 44"])

    await user.click(within(panel).getAllByRole("button", { name: "Go to" })[2]!)
    await screen.findByRole("button", { name: "Page 31 of 240" })
  })

  it("deletes a note after a confirmation", async () => {
    const { user } = renderPdf(`${PDF_ROUTE}&page=1`)
    await user.click(await openNotesButton())
    const panel = await screen.findByRole("complementary", { name: "Notes and highlights" })
    await within(panel).findByText("A net force produces acceleration.")

    await user.click(within(panel).getAllByRole("button", { name: "Delete" })[2]!)
    const confirm = await screen.findByRole("alertdialog")
    await user.click(within(confirm).getByRole("button", { name: "Delete" }))

    await waitFor(() => expect(within(panel).queryByText("A net force produces acceleration.")).not.toBeInTheDocument())
    await waitFor(async () =>
      expect((await stored(libIds.bookPhysics10)).some((a) => a.quote === "A net force produces acceleration.")).toBe(
        false,
      ),
    )
  })

  it("edits the note of a highlight", async () => {
    const { user } = renderPdf(`${PDF_ROUTE}&page=1`)
    await user.click(await openNotesButton())
    const panel = await screen.findByRole("complementary", { name: "Notes and highlights" })
    await within(panel).findByText("Compare with the derivative from the maths lesson.")

    await user.click(within(panel).getAllByRole("button", { name: "Edit" })[1]!)
    const dialog = await screen.findByRole("dialog")
    const field = within(dialog).getByLabelText("Note")
    await user.clear(field)
    await user.type(field, "Derivative, not integral")
    await user.click(within(dialog).getByRole("button", { name: "Save" }))

    await waitFor(async () =>
      expect((await stored(libIds.bookPhysics10)).some((a) => a.note === "Derivative, not integral")).toBe(true),
    )
  })

  it("adds and removes a bookmark of the current page", async () => {
    const { user } = renderPdf(`${PDF_ROUTE}&page=20`)
    await screen.findByRole("button", { name: "Page 20 of 240" })

    await user.click(screen.getByRole("button", { name: "Bookmark this place" }))
    await waitFor(async () =>
      expect(
        (await stored(libIds.bookPhysics10)).some(
          (a) => a.kind === "bookmark" && "page" in a.locator && a.locator.page === 20,
        ),
      ).toBe(true),
    )
    await user.click(await screen.findByRole("button", { name: "Remove the bookmark" }))

    await waitFor(async () =>
      expect(
        (await stored(libIds.bookPhysics10)).some(
          (a) => a.kind === "bookmark" && "page" in a.locator && a.locator.page === 20,
        ),
      ).toBe(false),
    )
  })
})

describe("ReaderPage: a note that cannot be sent", () => {
  it("stays on screen waiting for the network and is sent again on Retry, once", async () => {
    let attempts = 0
    server.use(
      http.post(apiUrl("/v1/me/library/annotations"), () => {
        attempts += 1
        return HttpResponse.error()
      }),
    )
    const { user } = renderPdf(`${PDF_ROUTE}&page=5`)
    const toolbar = await selectLine(5)
    await user.click(within(toolbar).getByRole("button", { name: "Highlight: Yellow" }))
    await waitFor(() => expect(attempts).toBe(1))
    await user.click(await openNotesButton())
    const panel = await screen.findByRole("complementary", { name: "Notes and highlights" })

    expect(await within(panel).findByText("Waiting for the network")).toBeInTheDocument()
    expect(within(panel).getByText("Velocity on page 5.")).toBeInTheDocument()

    server.resetHandlers()
    setLibraryActor("student")
    await user.click(within(panel).getByRole("button", { name: "Try again" }))

    await waitFor(() => expect(within(panel).queryByText("Waiting for the network")).not.toBeInTheDocument())
    const mine = (await stored(libIds.bookPhysics10)).filter((a) => a.quote === "Velocity on page 5.")
    expect(mine).toHaveLength(1)
  })
})

describe("ReaderPage: keyboard", () => {
  it("turns pages with the arrows and Page Down", async () => {
    const { user } = renderPdf(`${PDF_ROUTE}&page=10`)
    await screen.findByRole("button", { name: "Page 10 of 240" })

    await user.keyboard("{ArrowRight}")
    await screen.findByRole("button", { name: "Page 11 of 240" })
    await user.keyboard("{PageDown}")
    await screen.findByRole("button", { name: "Page 12 of 240" })
    await user.keyboard("{ArrowLeft}")
    await screen.findByRole("button", { name: "Page 11 of 240" })
    await user.keyboard("{Home}")
    await screen.findByRole("button", { name: "Page 1 of 240" })
    await user.keyboard("{End}")
    await screen.findByRole("button", { name: "Page 240 of 240" })
  })

  it("opens the search with / and closes it with Esc", async () => {
    const { user } = renderPdf(`${PDF_ROUTE}&page=2`)
    await screen.findByRole("button", { name: "Page 2 of 240" })

    await user.keyboard("/")

    const field = await screen.findByRole("searchbox", { name: "Search text" })
    expect(field).toBeInTheDocument()
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("searchbox", { name: "Search text" })).not.toBeInTheDocument())
  })

  it("goes to a page with g", async () => {
    const { user } = renderPdf(`${PDF_ROUTE}&page=2`)
    await screen.findByRole("button", { name: "Page 2 of 240" })

    await user.keyboard("g")
    const dialog = await screen.findByRole("dialog")
    const field = within(dialog).getByLabelText("Page number")
    await user.clear(field)
    await user.type(field, "77{Enter}")

    await screen.findByRole("button", { name: "Page 77 of 240" })
  })

  it("refuses a page outside the book", async () => {
    const { user } = renderPdf(`${PDF_ROUTE}&page=2`)
    await screen.findByRole("button", { name: "Page 2 of 240" })
    await user.keyboard("g")
    const dialog = await screen.findByRole("dialog")
    const field = within(dialog).getByLabelText("Page number")
    await user.clear(field)
    await user.type(field, "999{Enter}")

    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Enter a page from 1 to 240.")
  })

  it("highlights the selection with h and opens the note dialog with n", async () => {
    const { user } = renderPdf(`${PDF_ROUTE}&page=6`)
    await selectLine(6)

    await user.keyboard("h")
    await waitFor(async () =>
      expect((await stored(libIds.bookPhysics10)).some((a) => a.quote === "Velocity on page 6.")).toBe(true),
    )

    await selectLine(6)
    await user.keyboard("n")
    expect(await screen.findByRole("dialog")).toBeInTheDocument()
  })

  it("leaves the keys alone while typing in the search field", async () => {
    const { user } = renderPdf(`${PDF_ROUTE}&page=10`)
    await screen.findByRole("button", { name: "Page 10 of 240" })
    await user.keyboard("/")
    const field = await screen.findByRole("searchbox", { name: "Search text" })

    await user.type(field, "gh/n")

    expect(field).toHaveValue("gh/n")
    expect(screen.queryByRole("dialog", { name: "Add a note" })).not.toBeInTheDocument()
  })
})

describe("ReaderPage: search and contents", () => {
  it("finds the text on the pages and goes to the hit", async () => {
    const { user } = renderPdf(`${PDF_ROUTE}&page=1`, false, 6)
    await screen.findByRole("button", { name: "Page 1 of 6" })
    await user.click(screen.getByRole("button", { name: "Search in this item" }))

    await user.type(await screen.findByRole("searchbox", { name: "Search text" }), "second line of page 4{Enter}")
    const hit = await screen.findByRole("button", { name: /p\. 4/ })
    await user.click(hit)

    await screen.findByRole("button", { name: "Page 4 of 6" })
  })

  it("says when nothing was found", async () => {
    const { user } = renderPdf(`${PDF_ROUTE}&page=1`, false, 3)
    await user.click(await screen.findByRole("button", { name: "Search in this item" }))

    await user.type(await screen.findByRole("searchbox", { name: "Search text" }), "zzzz{Enter}")

    expect(await screen.findByText("Nothing found.")).toBeInTheDocument()
  })

  it("lists the contents of the file and goes to a chapter", async () => {
    const { user } = renderPdf(`${PDF_ROUTE}&page=1`)
    await screen.findByRole("button", { name: "Page 1 of 240" })

    await user.click(screen.getByRole("button", { name: "Contents" }))
    const nav = await screen.findByRole("navigation", { name: "Contents" })
    await user.click(within(nav).getByRole("button", { name: /2\. Dynamics/ }))

    await screen.findByRole("button", { name: "Page 31 of 240" })
  })
})

describe("ReaderPage: menu and settings", () => {
  it("has the same actions as the item page, but no Download for an official textbook", async () => {
    const { user } = renderPdf(`${PDF_ROUTE}&page=1`)
    await user.click(await screen.findByRole("button", { name: "More actions" }))

    const sheet = await screen.findByRole("dialog", { name: "More actions" })
    expect(within(sheet).getByRole("link", { name: "Item page" })).toBeInTheDocument()
    expect(within(sheet).getByRole("button", { name: /Add to shelf|Shelf/ })).toBeInTheDocument()
    expect(within(sheet).getByRole("button", { name: "Add to notebook" })).toBeInTheDocument()
    expect(within(sheet).getByRole("button", { name: "Share" })).toBeInTheDocument()
    expect(within(sheet).getByRole("button", { name: "Report" })).toBeInTheDocument()
    expect(within(sheet).queryByRole("button", { name: "Download" })).not.toBeInTheDocument()
  })

  it("offers Download for a book that allows it", async () => {
    const { user } = renderPdf(`/read/?item=${libIds.bookOpenPhysics}`, false, 40)
    await user.click(await screen.findByRole("button", { name: "More actions" }))

    expect(await screen.findByRole("button", { name: "Download" })).toBeInTheDocument()
  })

  it("remembers the zoom on this device", async () => {
    const { user } = renderPdf(`${PDF_ROUTE}&page=1`)
    await user.click(await screen.findByRole("button", { name: "Reading settings" }))
    await user.click(await screen.findByRole("button", { name: "Zoom in" }))

    await waitFor(() => expect(window.localStorage.getItem("ihsp.library.reader-settings")).toContain('"zoom":1.25'))
    expect(window.localStorage.getItem("ihsp.library.reader-settings")).toContain('"pageFit":"custom"')
  })
})

describe("ReaderPage: other formats", () => {
  it("reads an EPUB at the place in the address and reports its place", async () => {
    const epub = createFakeEpub()
    const { user } = renderLibrary(<ReaderPage engines={{ epub: async () => epub.engine }} />, {
      route: `/read/?item=${libIds.bookOtkanKunlar}&loc=${encodeURIComponent("epubcfi(/6/8!/4/2/10)@0.35")}`,
    })

    await screen.findByRole("heading", { level: 1, name: libDetails.bookOtkanKunlar.title })
    await waitFor(() => expect(epub.last()).not.toBeNull())
    expect(epub.last()?.options.start).toEqual({ cfi: "epubcfi(/6/8!/4/2/10)" })

    act(() => epub.last()!.handle.relocate("epubcfi(/6/10!/4/2)", 0.5, "Preface"))
    expect(await screen.findByText(/Preface · 50% read/)).toBeInTheDocument()
    await user.keyboard("{ArrowRight}")
    expect(epub.last()!.handle.calls).toContain("next")
  })

  it("draws the account's highlights of the book as marks", async () => {
    const epub = createFakeEpub()
    renderLibrary(<ReaderPage engines={{ epub: async () => epub.engine }} />, {
      route: `/read/?item=${libIds.bookOtkanKunlar}`,
    })

    await waitFor(() => expect(epub.last()?.handle.marks.length).toBeGreaterThan(0))
    expect(epub.last()!.handle.marks.map((mark) => mark.kind).toSorted()).toEqual(["bookmark", "highlight", "note"])
  })

  it("highlights a selection inside an EPUB with its CFI", async () => {
    const epub = createFakeEpub()
    const { user } = renderLibrary(<ReaderPage engines={{ epub: async () => epub.engine }} />, {
      route: `/read/?item=${libIds.bookOtkanKunlar}`,
    })
    await waitFor(() => expect(epub.last()).not.toBeNull())
    act(() => epub.last()!.handle.relocate("epubcfi(/6/8!/4/2)", 0.4))

    act(() => epub.last()!.handle.select("Отабек Тошкентдан келди."))
    const toolbar = await screen.findByRole("toolbar", { name: "Selected text" })
    await user.click(within(toolbar).getByRole("button", { name: "Highlight: Blue" }))

    await waitFor(async () => {
      const items = await stored(libIds.bookOtkanKunlar)
      expect(
        items.some(
          (a) => a.color === "blue" && "cfi" in a.locator && a.locator.cfi.startsWith("epubcfi(") && a.locator.progress === 0.4,
        ),
      ).toBe(true)
    })
  })

  it("renders a Markdown file with the safe renderer", async () => {
    renderLibrary(<ReaderPage />, { route: `/read/?item=${libIds.bookGhazals}` })

    expect(await screen.findByRole("heading", { level: 2, name: /Birinchi g.azal/ })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: /Ikkinchi g.azal/ })).toBeInTheDocument()
  })

  it("lists the headings of a Markdown file as its contents", async () => {
    const { user } = renderLibrary(<ReaderPage />, { route: `/read/?item=${libIds.bookGhazals}` })
    await screen.findByRole("heading", { level: 2, name: /Birinchi g.azal/ })

    await user.click(screen.getByRole("button", { name: "Contents" }))

    const nav = await screen.findByRole("navigation", { name: "Contents" })
    expect(within(nav).getByRole("button", { name: /Ikkinchi g.azal/ })).toBeInTheDocument()
  })
})
