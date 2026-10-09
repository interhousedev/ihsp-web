import { describe, expect, it, mock } from "bun:test"
import { libDetails, server } from "@ihsp/test-utils"
import { act, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { createRef } from "react"
import { allowSlowRenders, renderLibrary } from "../test-support"
import { EpubReader } from "./epub-reader"
import { createFileLinks } from "./lib/file-link"
import { DEFAULT_SETTINGS } from "./lib/reader-settings"
import type { ReaderHandle, ReaderPosition, ReaderSelection, ReaderViewProps } from "./reader-types"
import type { ViewAnnotation } from "./use-reader-annotations"
import { createFakeEpub } from "./testing/fake-engines"

allowSlowRenders()

const item = libDetails.bookOtkanKunlar
const file = item.files[0]!
const links = createFileLinks(async () => ({
  url: "https://storage.test/library/files/book.epub",
  expires_at: new Date(Date.now() + 900_000).toISOString(),
  content_type: "application/epub+zip",
  byte_size: 1000,
}))

function annotation(overrides: Partial<ViewAnnotation>): ViewAnnotation {
  return {
    id: "a1",
    client_id: "c1",
    item_id: item.id!,
    file_id: file.id,
    kind: "highlight",
    locator: { cfi: "epubcfi(/6/8!/4/2)", progress: 0.3 },
    quote: "quote",
    note: null,
    color: "green",
    updated_at: "2026-10-01T00:00:00Z",
    sync: "synced",
    ...overrides,
  }
}

/** The book is downloaded once from the presigned URL; the content does not matter to the fake engine. */
function serveBook() {
  server.use(
    http.get(
      "https://storage.test/library/files/book.epub",
      () => new HttpResponse("PK-fake-epub", { headers: { "Content-Type": "application/epub+zip" } }),
    ),
  )
}

function setup(
  overrides: Partial<ReaderViewProps> = {},
  loadEngine?: () => Promise<ReturnType<typeof createFakeEpub>["engine"]>,
) {
  serveBook()
  const fake = createFakeEpub()
  const positions: ReaderPosition[] = []
  const selections: (ReaderSelection | null)[] = []
  const handle = createRef<ReaderHandle>()
  const onAnnotationClick = mock()
  const props: ReaderViewProps = {
    item,
    file,
    links,
    start: null,
    annotations: [],
    settings: DEFAULT_SETTINGS,
    language: "uz",
    onPosition: (position) => positions.push(position),
    onSelection: (selection) => selections.push(selection),
    onAnnotationClick,
    onReady: mock(),
    onError: mock(),
    ref: handle,
    ...overrides,
  }
  const view = renderLibrary(<EpubReader {...props} loadEngine={loadEngine ?? (async () => fake.engine)} />)
  return { fake, positions, selections, handle, onAnnotationClick, props, ...view }
}

describe("EpubReader", () => {
  it("downloads the book once through the file links and hands it to the engine", async () => {
    const { fake, props } = setup({ start: { cfi: "epubcfi(/6/8!/4/2)", progress: 0.3 } })

    await waitFor(() => expect(fake.last()).not.toBeNull())
    const opened = fake.last()!.options
    expect(opened.file).toBeInstanceOf(Blob)
    expect(opened.start).toEqual({ cfi: "epubcfi(/6/8!/4/2)" })
    expect(opened.style).toMatchObject({ fontSize: 100, lineHeight: 1.5, flow: "paginated" })
    await waitFor(() => expect(props.onReady).toHaveBeenCalledWith({ pages: null, title: "A fake book" }))
  })

  it("opens at a fraction of the book when there is no CFI", async () => {
    const { fake } = setup({ start: null, startFraction: 0.6 })

    await waitFor(() => expect(fake.last()?.options.start).toEqual({ fraction: 0.6 }))
  })

  it("reports the place as a CFI with the progress of the whole book", async () => {
    const { fake, positions } = setup()
    await waitFor(() => expect(fake.last()).not.toBeNull())

    act(() => fake.last()!.handle.relocate("epubcfi(/6/10!/4/2)", 0.52, "Chapter 2"))

    expect(positions.at(-1)).toEqual({
      locator: { cfi: "epubcfi(/6/10!/4/2)", progress: 0.52 },
      fraction: 0.52,
      label: "Chapter 2",
      page: 2,
      pages: 10,
    })
  })

  it("reports a selection with the CFI and the progress at that moment", async () => {
    const { fake, selections } = setup()
    await waitFor(() => expect(fake.last()).not.toBeNull())
    act(() => fake.last()!.handle.relocate("epubcfi(/6/8!/4/2)", 0.4))

    act(() => fake.last()!.handle.select("  Отабек   Тошкентдан\nкелди. "))

    expect(selections.at(-1)).toMatchObject({
      text: "Отабек Тошкентдан келди.",
      locator: { cfi: "epubcfi(/6/4!/4/2,/1:0,/1:5)", progress: 0.4 },
      page: null,
    })
    act(() => fake.last()!.handle.clearSelection())
    expect(selections.at(-1)).toBeNull()
  })

  it("passes the highlights and notes with a CFI to the book as marks, and nothing else", async () => {
    const { fake } = setup({
      annotations: [
        annotation({ id: "h", kind: "highlight" }),
        annotation({ id: "n", kind: "note", color: "blue" }),
        annotation({ id: "p", locator: { page: 3 } }),
        annotation({ id: "f", sync: "failed" }),
      ],
    })

    await waitFor(() => expect(fake.last()?.handle.marks.length).toBe(2))
    expect(fake.last()!.handle.marks.map((mark) => [mark.id, mark.color])).toEqual([
      ["h", "green"],
      ["n", "blue"],
    ])
  })

  it("tells the frame which annotation was tapped in the text", async () => {
    const { fake, onAnnotationClick } = setup()
    await waitFor(() => expect(fake.last()).not.toBeNull())

    act(() => fake.last()!.handle.clickMark("a1"))

    expect(onAnnotationClick).toHaveBeenCalledWith("a1")
  })

  it("restyles the book when the text size changes", async () => {
    const { fake, rerender, props } = setup()
    await waitFor(() => expect(fake.last()).not.toBeNull())

    rerender(
      <EpubReader
        {...props}
        settings={{ ...DEFAULT_SETTINGS, fontSize: 140, flow: "scrolled" }}
        loadEngine={async () => fake.engine}
      />,
    )

    await waitFor(() => expect(fake.last()!.handle.style).toMatchObject({ fontSize: 140, flow: "scrolled" }))
  })

  it("turns pages, goes to a chapter and to a place", async () => {
    const { fake, handle } = setup()
    await waitFor(() => expect(handle.current).not.toBeNull())
    await waitFor(() => expect(fake.last()).not.toBeNull())

    act(() => {
      handle.current!.next()
      handle.current!.prev()
      handle.current!.first()
      handle.current!.last()
      handle.current!.goToLocator({ cfi: "epubcfi(/6/2)", progress: 0.1 })
      handle.current!.goToToc({ title: "Preface", level: 0, page: null, href: "ch1.xhtml" })
    })

    expect(fake.last()!.handle.calls).toEqual([
      "next",
      "prev",
      "fraction 0",
      "fraction 1",
      "goTo epubcfi(/6/2)",
      "goTo ch1.xhtml",
    ])
  })

  it("gives the contents of the book itself", async () => {
    const { handle, fake } = setup()
    await waitFor(() => expect(fake.last()).not.toBeNull())

    expect(await handle.current!.loadToc!()).toEqual([
      { title: "Preface", level: 0, page: null, href: "ch1.xhtml" },
      { title: "Chapter 2", level: 0, page: null, href: "ch2.xhtml" },
    ])
  })

  it("searches the book and names each hit by its chapter", async () => {
    const { handle, fake } = setup()
    await waitFor(() => expect(fake.last()).not.toBeNull())

    const hits = []
    for await (const hit of handle.current!.search!("Отабек", new AbortController().signal)) hits.push(hit)

    expect(hits).toMatchObject([{ id: "e1", cfi: "epubcfi(/6/4!/4/2)", label: "Preface", page: null }])
  })

  it("closes the book when the reader goes away", async () => {
    const { fake, unmount } = setup()
    await waitFor(() => expect(fake.last()).not.toBeNull())

    unmount()

    expect(fake.last()!.handle.destroyed).toBe(true)
  })

  it("explains a fixed-layout EPUB instead of showing a broken page", async () => {
    setup({}, async () => ({
      open: async () => {
        throw new Error("fixed-layout")
      },
    }))

    expect(await screen.findByText(/fixed page layout/)).toBeInTheDocument()
  })

  it("shows an error with a retry for any other failure", async () => {
    setup({}, async () => ({
      open: async () => {
        throw new Error("broken zip")
      },
    }))

    expect(await screen.findByRole("button", { name: "Try again" })).toBeInTheDocument()
  })
})
