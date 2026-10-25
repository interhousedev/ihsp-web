import { describe, expect, it, mock } from "bun:test"
import { libDetails } from "@ihsp/test-utils"
import { act, screen, waitFor } from "@testing-library/react"
import { createRef, type RefObject } from "react"
import { allowSlowRenders, renderLibrary } from "../test-support"
import { createFileLinks } from "./lib/file-link"
import { DEFAULT_SETTINGS } from "./lib/reader-settings"
import { PdfReader } from "./pdf-reader"
import type { ReaderHandle, ReaderPosition, ReaderSelection, ReaderViewProps } from "./reader-types"
import { createFakePdf } from "./testing/fake-engines"

allowSlowRenders()

const item = libDetails.bookPhysics10
const file = item.files[0]!
const links = createFileLinks(async () => ({
  url: "https://storage.test/file.pdf",
  expires_at: new Date(Date.now() + 900_000).toISOString(),
  content_type: "application/pdf",
  byte_size: 1000,
}))

function setup(overrides: Partial<ReaderViewProps> = {}, pages = 500) {
  const fake = createFakePdf(pages, (page) => `Velocity on page ${page}.\nSecond line of page ${page}.`)
  const positions: ReaderPosition[] = []
  const selections: (ReaderSelection | null)[] = []
  const handle: RefObject<ReaderHandle | null> = createRef<ReaderHandle>()
  const props: ReaderViewProps = {
    item,
    file,
    links,
    start: null,
    annotations: [],
    settings: DEFAULT_SETTINGS,
    language: "en",
    onPosition: (position) => positions.push(position),
    onSelection: (selection) => selections.push(selection),
    onAnnotationClick: mock(),
    onReady: mock(),
    onError: mock(),
    ref: handle,
    ...overrides,
  }
  const view = renderLibrary(<PdfReader {...props} loadEngine={async () => fake.engine} />)
  return { fake, positions, selections, handle, ...view }
}

const pageBoxes = () => Array.from(document.querySelectorAll<HTMLElement>("[data-page]"))

describe("PdfReader", () => {
  it("opens the document through the file links and starts at the first page", async () => {
    const { fake, positions } = setup()

    await waitFor(() => expect(pageBoxes().length).toBeGreaterThan(0))
    expect(fake.opened[0]?.links).toBe(links)
    await waitFor(() => expect(positions.at(-1)?.locator).toEqual({ page: 1 }))
  })

  it("opens at the saved page and draws only the pages near it, not all 500", async () => {
    const { fake, positions } = setup({ start: { page: 250 } })

    await waitFor(() => expect(positions.at(-1)?.locator).toEqual({ page: 250 }))
    await waitFor(() => expect(fake.drawn.has(250)).toBe(true))
    const mounted = pageBoxes().map((box) => Number(box.dataset.page))
    expect(mounted).toContain(250)
    expect(mounted.length).toBeLessThan(10)
    expect(Math.min(...mounted)).toBeGreaterThan(240)
    expect(fake.drawn.has(1)).toBe(false)
    expect(positions.at(-1)?.fraction).toBe(0.5)
  })

  it("opens at a fraction when there is no page, as the saved percent of a Continue link", async () => {
    const { positions } = setup({ start: null, startFraction: 0.5 })

    await waitFor(() => expect(positions.at(-1)?.locator).toEqual({ page: 250 }))
  })

  it("keeps the text of every drawn page in a text layer a screen reader can read", async () => {
    setup({ start: { page: 3 } })

    await waitFor(() => expect(screen.getByText("Velocity on page 3.")).toBeInTheDocument())
    expect(screen.getByRole("group", { name: "Page 3" })).toBeInTheDocument()
  })

  it("goes to a page, to the next one and back", async () => {
    const { handle, positions } = setup({ start: { page: 10 } })
    await waitFor(() => expect(positions.at(-1)?.locator).toEqual({ page: 10 }))

    act(() => handle.current?.goToPage?.(40))
    await waitFor(() => expect(positions.at(-1)?.locator).toEqual({ page: 40 }))
    act(() => handle.current?.next())
    await waitFor(() => expect(positions.at(-1)?.locator).toEqual({ page: 41 }))
    act(() => handle.current?.prev())
    act(() => handle.current?.prev())
    await waitFor(() => expect(positions.at(-1)?.locator).toEqual({ page: 39 }))
    act(() => handle.current?.last())
    await waitFor(() => expect(positions.at(-1)?.locator).toEqual({ page: 500 }))
    act(() => handle.current?.first())
    await waitFor(() => expect(positions.at(-1)?.locator).toEqual({ page: 1 }))
  })

  it("stays inside the document", async () => {
    const { handle, positions } = setup({}, 12)
    await waitFor(() => expect(positions.length).toBeGreaterThan(0))

    act(() => handle.current?.goToPage?.(99))
    await waitFor(() => expect(positions.at(-1)?.locator).toEqual({ page: 12 }))
    act(() => handle.current?.goToPage?.(0))
    await waitFor(() => expect(positions.at(-1)?.locator).toEqual({ page: 1 }))
  })

  it("reports the selected text with its page", async () => {
    const { selections } = setup({ start: { page: 7 } })
    await waitFor(() => expect(screen.getByText("Velocity on page 7.")).toBeInTheDocument())
    const line = screen.getByText("Velocity on page 7.")

    const range = document.createRange()
    range.selectNodeContents(line)
    const selection = window.getSelection()!
    selection.removeAllRanges()
    selection.addRange(range)
    document.dispatchEvent(new Event("selectionchange"))

    await waitFor(() => expect(selections.at(-1)).not.toBeNull(), { timeout: 3000 })
    expect(selections.at(-1)).toMatchObject({ text: "Velocity on page 7.", page: 7, locator: { page: 7 } })
  })

  it("searches the pages in order and finds Uzbek text in either script", async () => {
    const fake = createFakePdf(4, (page) => (page === 3 ? "Ўзбек тили va o'zbek adabiyoti" : `Page ${page}`))
    const handle = createRef<ReaderHandle>()
    renderLibrary(
      <PdfReader
        item={item}
        file={file}
        links={links}
        start={null}
        annotations={[]}
        settings={DEFAULT_SETTINGS}
        language="uz"
        onPosition={() => undefined}
        onSelection={() => undefined}
        onAnnotationClick={() => undefined}
        onReady={() => undefined}
        onError={() => undefined}
        ref={handle}
        loadEngine={async () => fake.engine}
      />,
    )
    await waitFor(() => expect(handle.current).not.toBeNull())

    const hits = []
    for await (const hit of handle.current!.search!("o'zbek", new AbortController().signal)) hits.push(hit)

    expect(hits.map((hit) => [hit.page, hit.excerpt.match])).toEqual([
      [3, "Ўзбек"],
      [3, "o'zbek"],
    ])
  })

  it("shows the contents found in the file when the server has none", async () => {
    const { handle } = setup({}, 10)
    await waitFor(() => expect(handle.current).not.toBeNull())

    const toc = await handle.current!.loadToc!()

    expect(toc).toEqual([
      { title: "Chapter one", level: 0, page: 2, href: null },
      { title: "Section 1.1", level: 1, page: 3, href: null },
    ])
  })

  it("shows an error with a retry when the document cannot be opened", async () => {
    const onError = mock()
    const { user } = renderLibrary(
      <PdfReader
        item={item}
        file={file}
        links={links}
        start={null}
        annotations={[]}
        settings={DEFAULT_SETTINGS}
        language="en"
        onPosition={() => undefined}
        onSelection={() => undefined}
        onAnnotationClick={() => undefined}
        onReady={() => undefined}
        onError={onError}
        loadEngine={async () => ({
          open: async () => {
            throw new Error("boom")
          },
        })}
      />,
    )

    expect(await screen.findByRole("alert")).toBeInTheDocument()
    expect(onError).toHaveBeenCalled()
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Try again" }))
  })
})
