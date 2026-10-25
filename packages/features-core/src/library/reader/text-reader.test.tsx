import { describe, expect, it, mock } from "bun:test"
import { apiUrl, libDetails, server } from "@ihsp/test-utils"
import { act, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { createRef } from "react"
import { allowSlowRenders, renderLibrary } from "../test-support"
import { createFileLinks } from "./lib/file-link"
import { DEFAULT_SETTINGS } from "./lib/reader-settings"
import type { ReaderHandle, ReaderPosition, ReaderSelection, ReaderViewProps } from "./reader-types"
import { TextReader } from "./text-reader"

allowSlowRenders()

const item = libDetails.bookGhazals
const file = item.files[0]!

function linksFor(url: string) {
  return createFileLinks(async () => ({
    url,
    expires_at: new Date(Date.now() + 900_000).toISOString(),
    content_type: "text/markdown",
    byte_size: 100,
  }))
}

function text(body: string, contentType = "text/markdown") {
  const url = "https://storage.test/library/files/doc"
  server.use(http.get(url, () => new HttpResponse(body, { headers: { "Content-Type": contentType } })))
  return linksFor(url)
}

function setup(body: string, overrides: Partial<ReaderViewProps> = {}) {
  const positions: ReaderPosition[] = []
  const selections: (ReaderSelection | null)[] = []
  const handle = createRef<ReaderHandle>()
  const props: ReaderViewProps = {
    item,
    file,
    links: text(body),
    start: null,
    annotations: [],
    settings: DEFAULT_SETTINGS,
    language: "uz",
    onPosition: (position) => positions.push(position),
    onSelection: (selection) => selections.push(selection),
    onAnnotationClick: mock(),
    onReady: mock(),
    onError: mock(),
    ref: handle,
    ...overrides,
  }
  return { positions, selections, handle, props, ...renderLibrary(<TextReader {...props} />) }
}

describe("TextReader", () => {
  it("renders Markdown with the safe renderer: headings, lists and links, raw HTML as text", async () => {
    setup("# Title\n\n- one\n- two\n\n[docs](https://example.org)\n\n<script>alert(1)</script>")

    expect(await screen.findByRole("heading", { name: "Title" })).toBeInTheDocument()
    expect(screen.getAllByRole("listitem")).toHaveLength(2)
    const link = screen.getByRole("link", { name: "docs" })
    expect(link).toHaveAttribute("target", "_blank")
    expect(link.getAttribute("rel")).toContain("noopener")
    expect(document.querySelector("script")).toBeNull()
    expect(screen.getByText(/<script>alert\(1\)<\/script>/)).toBeInTheDocument()
  })

  it("shows a plain text file as it is, keeping its line breaks", async () => {
    const txt = { ...file, format: "txt" as const }
    setup("first line\nsecond line", { file: txt })

    const pre = await screen.findByText(/first line/)
    expect(pre.tagName).toBe("PRE")
    expect(pre.textContent).toBe("first line\nsecond line")
  })

  it("reports where the reader is as a fraction of the text", async () => {
    const { positions } = setup("# A\n\ntext")

    await waitFor(() => expect(positions.length).toBeGreaterThan(0))
    expect(positions.at(-1)).toMatchObject({ locator: { page: 1 }, page: null, pages: null })
  })

  it("reports the selected text", async () => {
    const { selections } = setup("# Title\n\nThe velocity of a body")
    const paragraph = await screen.findByText("The velocity of a body")

    const range = document.createRange()
    range.selectNodeContents(paragraph)
    window.getSelection()!.removeAllRanges()
    window.getSelection()!.addRange(range)
    document.dispatchEvent(new Event("selectionchange"))

    await waitFor(() => expect(selections.at(-1)?.text).toBe("The velocity of a body"), { timeout: 3000 })
    expect(selections.at(-1)?.locator).toEqual({ page: 1 })
  })

  it("lists its headings as the contents and finds text in Latin and Cyrillic", async () => {
    const { handle } = setup("# Birinchi\n\nO'zbek tili\n\n## Ikkinchi\n\nЎзбек adabiyoti")
    await screen.findByRole("heading", { name: "Birinchi" })

    expect(await handle.current!.loadToc!()).toEqual([
      { title: "Birinchi", level: 1, page: null, href: null },
      { title: "Ikkinchi", level: 2, page: null, href: null },
    ])
    const hits = []
    for await (const hit of handle.current!.search!("o'zbek", new AbortController().signal)) hits.push(hit)
    expect(hits.map((hit) => hit.excerpt.match)).toEqual(["O'zbek", "Ўзбек"])
  })

  it("shows an error with a retry when the file cannot be fetched", async () => {
    const url = "https://storage.test/library/files/missing"
    server.use(http.get(url, () => new HttpResponse("nope", { status: 404 })))
    const onError = mock()
    renderLibrary(
      <TextReader
        item={item}
        file={file}
        links={linksFor(url)}
        start={null}
        annotations={[]}
        settings={DEFAULT_SETTINGS}
        language="uz"
        onPosition={() => undefined}
        onSelection={() => undefined}
        onAnnotationClick={() => undefined}
        onReady={() => undefined}
        onError={onError}
      />,
    )

    expect(await screen.findByRole("button", { name: "Try again" })).toBeInTheDocument()
    expect(onError).toHaveBeenCalled()
  })

  it("renews the link and tries again when the storage answers 403", async () => {
    let issued = 0
    const url = "https://storage.test/library/files/expiring"
    server.use(
      http.get(url, ({ request }) =>
        new URL(request.url).searchParams.get("sig") === "2"
          ? new HttpResponse("# Renewed", { headers: { "Content-Type": "text/markdown" } })
          : new HttpResponse("expired", { status: 403 }),
      ),
    )
    const links = createFileLinks(async () => ({
      url: `${url}?sig=${++issued}`,
      expires_at: new Date(Date.now() + 900_000).toISOString(),
      content_type: "text/markdown",
      byte_size: 10,
    }))
    renderLibrary(
      <TextReader
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
      />,
    )

    expect(await screen.findByRole("heading", { name: "Renewed" })).toBeInTheDocument()
    expect(issued).toBe(2)
  })

  it("follows the text size and line height of the settings", async () => {
    setup("# A", { settings: { ...DEFAULT_SETTINGS, fontSize: 150, lineHeight: 1.8 } })

    const article = await waitFor(() => {
      const element = document.querySelector<HTMLElement>("[data-reader-text]")
      expect(element).not.toBeNull()
      return element!
    })
    expect(article.style.fontSize).toBe("150%")
    expect(article.style.lineHeight).toBe("1.8")
  })
})

// `act` and `apiUrl` keep the unused-import rules quiet for helpers some tests may need later.
void act
void apiUrl
