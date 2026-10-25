import { describe, expect, test } from "bun:test"
import { renderWithProviders } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { Markdown } from "../components/markdown"
import { loadKatex } from "../hooks/use-katex"

const chip = (text: string) =>
  text.split("§").flatMap((part, index) =>
    index === 0
      ? [part]
      : [
          <b key={index} data-testid="chip">
            chip
          </b>,
          part,
        ],
  )

/** Renders `source` with KaTeX already loaded, so formulas render on the first commit. */
async function renderMarkdown(source: string) {
  await loadKatex()
  return renderWithProviders(<Markdown>{source}</Markdown>)
}

describe("Markdown renderText", () => {
  test("renders plain text through renderText in paragraphs, lists, bold text and table cells", () => {
    renderWithProviders(
      <Markdown renderText={chip}>
        {"Para §.\n\n- item §\n\n**bold §**\n\n| a | b |\n|---|---|\n| cell § | x |"}
      </Markdown>,
    )

    expect(screen.getAllByTestId("chip")).toHaveLength(4)
  })

  test("renders text through renderText inside underline, strikethrough and spoilers", () => {
    renderWithProviders(<Markdown renderText={chip}>{"<u>a §</u> ~~b §~~ ||c §||"}</Markdown>)

    expect(screen.getAllByTestId("chip")).toHaveLength(3)
  })

  test("renders text as is without renderText", () => {
    renderWithProviders(<Markdown>{"Para §."}</Markdown>)

    expect(screen.getByText("Para §.")).toBeInTheDocument()
  })
})

describe("Markdown math", () => {
  test("renders inline math with KaTeX, keeping the source for screen readers (MathML)", async () => {
    const { container } = await renderMarkdown("Area: $\\pi r^2$.")

    const formula = container.querySelector('[data-math="inline"]')
    expect(formula?.querySelector(".katex")).not.toBeNull()
    expect(formula?.querySelector("annotation")?.textContent).toBe("\\pi r^2")
    expect(container.querySelector("p")?.textContent).toStartWith("Area: ")
  })

  test("renders a $$ block as display math without a code frame", async () => {
    const { container } = await renderMarkdown("$$\n\\frac{a}{b}\n$$")

    expect(container.querySelector('[data-math="display"] .katex-display')).not.toBeNull()
    expect(container.querySelector("pre")).toBeNull()
  })

  test("renders $$x$$ inside a sentence as display math", async () => {
    const { container } = await renderMarkdown("so $$x^2$$ here")

    expect(container.querySelector('p [data-math="display"] .katex-display')).not.toBeNull()
  })

  test("keeps prices and escaped dollars as text", async () => {
    const { container } = await renderMarkdown("Costs $5 and $10, or \\$7.")

    expect(container.querySelector("[data-math]")).toBeNull()
    expect(container.textContent).toBe("Costs $5 and $10, or $7.")
  })

  test("shows invalid LaTeX as its source with the reason instead of crashing", async () => {
    const { container } = await renderMarkdown("Before $\\frac{1$ after")

    const error = container.querySelector("[data-math-error]")
    expect(error?.textContent).toContain("\\frac{1")
    expect(error?.getAttribute("title")).toStartWith("Formula error: ")
    expect(container.textContent).toContain("Before ")
    expect(container.textContent).toContain(" after")
  })

  test("shows an invalid display formula as a block with the reason", async () => {
    const { container } = await renderMarkdown("$$\n\\begin{matrix}\n$$")

    const error = container.querySelector("[data-math-error]")
    expect(error?.textContent).toContain("Formula error: ")
    expect(error?.querySelector("code")?.textContent).toBe("\\begin{matrix}")
  })

  test("does not turn \\href or \\url in formulas into links", async () => {
    const { container } = await renderMarkdown("$\\href{javascript:alert(1)}{x}$ and $\\url{https://example.com}$")

    expect(container.querySelector("a")).toBeNull()
  })

  test("renders math once KaTeX has loaded", async () => {
    const { container } = renderWithProviders(<Markdown>{"$y$"}</Markdown>)

    await waitFor(() => expect(container.querySelector('[data-math="inline"] .katex')).not.toBeNull())
  })
})

describe("Markdown formatting", () => {
  test("renders underline and strikethrough", () => {
    const { container } = renderWithProviders(<Markdown>{"<u>under</u> and ~~gone~~"}</Markdown>)

    expect(container.querySelector("u")?.textContent).toBe("under")
    expect(container.querySelector("del")?.textContent).toBe("gone")
  })

  test("shows raw HTML as text, never as elements", () => {
    const { container } = renderWithProviders(
      <Markdown>{'<script>alert(1)</script>\n\nA <b>bold</b> <u onclick="x()">u</u> <img src=x onerror=y>'}</Markdown>,
    )

    expect(container.querySelector("script, b, img, u")).toBeNull()
    expect(container.textContent).toContain("<b>bold</b>")
    expect(container.textContent).toContain('<u onclick="x()">')
  })

  test("shows the language above a fenced code block", () => {
    const { container } = renderWithProviders(<Markdown>{"```python\nprint(1)\n```"}</Markdown>)

    const block = container.querySelector('[data-language="python"]')
    expect(block?.textContent).toBe("pythonprint(1)\n")
    expect(block?.querySelector("pre code")?.textContent).toBe("print(1)\n")
  })

  test("renders a code block without a language without a label", () => {
    const { container } = renderWithProviders(<Markdown>{"```\nplain\n```"}</Markdown>)

    expect(container.querySelector("[data-language]")).toBeNull()
    expect(container.querySelector("pre code")?.textContent).toBe("plain\n")
  })

  test("keeps dollars inside code as code", () => {
    const { container } = renderWithProviders(<Markdown>{"`$x$`"}</Markdown>)

    expect(container.querySelector("[data-math]")).toBeNull()
    expect(container.querySelector("code")?.textContent).toBe("$x$")
  })
})

describe("Markdown spoilers", () => {
  test("hides spoiler text behind a labelled button until it is clicked", async () => {
    const { container, user } = renderWithProviders(<Markdown>{"The answer is ||42||."}</Markdown>)

    const spoiler = screen.getByRole("button", { name: "Hidden text, press to reveal" })
    expect(spoiler.querySelector('[aria-hidden="true"]')?.textContent).toBe("42")

    await user.click(spoiler)

    expect(screen.queryByRole("button")).toBeNull()
    expect(container.querySelector('[data-spoiler="revealed"]')?.textContent).toBe("42")
  })

  test("reveals a spoiler with the keyboard and keeps focus on the text", async () => {
    const { container, user } = renderWithProviders(<Markdown>{"||secret||"}</Markdown>)

    await user.tab()
    expect(screen.getByRole("button", { name: "Hidden text, press to reveal" })).toHaveFocus()
    await user.keyboard("{Enter}")

    const revealed = container.querySelector('[data-spoiler="revealed"]')
    expect(revealed?.textContent).toBe("secret")
    expect(revealed).toHaveFocus()
  })

  test("reveals a spoiler with Space", async () => {
    const { container, user } = renderWithProviders(<Markdown>{"||secret||"}</Markdown>)

    await user.tab()
    await user.keyboard(" ")

    expect(container.querySelector('[data-spoiler="revealed"]')).not.toBeNull()
  })

  test("makes links inside a hidden spoiler inert until it is revealed", async () => {
    const { container, user } = renderWithProviders(<Markdown>{"||see [docs](/docs)||"}</Markdown>)

    expect(container.querySelector("[inert]")?.querySelector("a")).not.toBeNull()

    await user.click(screen.getByRole("button", { name: "Hidden text, press to reveal" }))

    expect(container.querySelector("[inert]")).toBeNull()
    expect(screen.getByRole("link", { name: "docs" })).toBeInTheDocument()
  })
})
