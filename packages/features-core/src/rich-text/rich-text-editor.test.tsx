import { describe, expect, mock, test } from "bun:test"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { useState } from "react"
import { RichTextEditor, isSafeLinkUrl } from "./rich-text-editor"
import { renderRichText } from "./test-support"

describe("isSafeLinkUrl", () => {
  test("accepts https, mailto and app-relative links", () => {
    expect(isSafeLinkUrl("https://iht.uz/a")).toBe(true)
    expect(isSafeLinkUrl("mailto:a@b.uz")).toBe(true)
    expect(isSafeLinkUrl("/library/1")).toBe(true)
  })

  test("rejects javascript:, data:, http: and protocol-relative links", () => {
    for (const url of ["javascript:alert(1)", " JavaScript:alert(1)", "data:text/html,x", "http://a.uz", "//evil.uz"]) {
      expect(isSafeLinkUrl(url)).toBe(false)
    }
  })
})

function Harness({
  initial,
  onValue,
  ...rest
}: { initial: string; onValue?: (v: string) => void } & Record<string, unknown>) {
  const [value, setValue] = useState(initial)
  return (
    <RichTextEditor
      value={value}
      onChange={(next) => {
        setValue(next)
        onValue?.(next)
      }}
      ariaLabel="Body"
      {...rest}
    />
  )
}

const visualButton = () => screen.getByRole("button", { name: "Visual" }) as HTMLButtonElement

describe("RichTextEditor", () => {
  test("renders Markdown as formatted text and a toolbar action emits Markdown", async () => {
    const onChange = mock((_markdown: string) => {})
    renderRichText(<RichTextEditor value="hello **world**" onChange={onChange} ariaLabel="Body" />)
    const field = await screen.findByRole("textbox", { name: "Body" })
    await waitFor(() => expect(field.querySelector("strong")?.textContent).toBe("world"))
    const heading = screen.getByRole("button", { name: "Heading 2" }) as HTMLButtonElement
    await waitFor(() => expect(heading.disabled).toBe(false))
    fireEvent.click(heading)
    await waitFor(() => expect(onChange).toHaveBeenCalled())
    expect(onChange.mock.calls.at(-1)?.[0]).toContain("## hello")
  })

  test("the link form refuses javascript: and shows an error", async () => {
    const onChange = mock((_markdown: string) => {})
    renderRichText(<RichTextEditor value="text" onChange={onChange} ariaLabel="Body" />)
    await screen.findByRole("textbox", { name: "Body" })
    const link = screen.getByRole("button", { name: "Link" }) as HTMLButtonElement
    await waitFor(() => expect(link.disabled).toBe(false))
    fireEvent.click(link)
    const input = await screen.findByRole("textbox", { name: "Link address" })
    fireEvent.change(input, { target: { value: "javascript:alert(1)" } })
    fireEvent.submit(input.closest("form") as HTMLFormElement)
    expect(await screen.findByRole("alert")).toBeTruthy()
    expect(onChange).not.toHaveBeenCalled()
  })

  test("plain bold, list and link content opens in the visual mode and is not rewritten", async () => {
    const onChange = mock((_markdown: string) => {})
    const text = "Some **bold** text\n\n- one\n- two\n\n[site](https://iht.uz/a)"
    renderRichText(<RichTextEditor value={text} onChange={onChange} ariaLabel="Body" />)
    const field = await screen.findByRole("textbox", { name: "Body" })
    await waitFor(() => expect(field.querySelector("strong")?.textContent).toBe("bold"))
    expect(field.querySelectorAll("li")).toHaveLength(2)
    expect(field.querySelector("a")?.getAttribute("href")).toBe("https://iht.uz/a")
    expect(field.tagName).not.toBe("TEXTAREA")
    expect(screen.queryByRole("status")).toBeNull()
    expect(onChange).not.toHaveBeenCalled()
  })

  test("a formula opens in the Markdown mode with its text, a preview and the visual mode off", async () => {
    const text = "Speed is $v = s / t$\n\n$$x^2$$"
    renderRichText(<Harness initial={text} />)
    const field = (await screen.findByRole("textbox", { name: "Body" })) as HTMLTextAreaElement
    expect(field.tagName).toBe("TEXTAREA")
    expect(field.value).toBe(text)
    await waitFor(() => expect(screen.getByRole("region", { name: "Preview" }).querySelector(".katex")).not.toBeNull())
    expect(screen.getByRole("status")).toBeTruthy()
    await waitFor(() => expect(visualButton().disabled).toBe(true))
  })

  test("a table opens in the Markdown mode", async () => {
    renderRichText(<Harness initial={"| a | b |\n| - | - |\n| 1 | 2 |"} />)
    const field = await screen.findByRole("textbox", { name: "Body" })
    await waitFor(() => expect(field.tagName).toBe("TEXTAREA"))
  })

  test("typing a formula in the Markdown mode shows it in the preview and keeps the text unchanged", async () => {
    const seen: string[] = []
    renderRichText(<Harness initial="" defaultMode="markdown" onValue={(v) => seen.push(v)} />)
    const field = await screen.findByRole("textbox", { name: "Body" })
    fireEvent.change(field, { target: { value: "## Speed\n$v = s / t$" } })
    const preview = screen.getByRole("region", { name: "Preview" })
    await waitFor(() => expect(preview.querySelector(".katex")).not.toBeNull())
    expect(seen.at(-1)).toBe("## Speed\n$v = s / t$")
  })

  test("switching to the visual mode and back keeps plain Markdown", async () => {
    renderRichText(<Harness initial="plain **text**" />)
    await screen.findByRole("textbox", { name: "Body" })
    fireEvent.click(screen.getByRole("button", { name: "Markdown" }))
    const field = (await screen.findByRole("textbox", { name: "Body" })) as HTMLTextAreaElement
    expect(field.tagName).toBe("TEXTAREA")
    expect(field.value).toBe("plain **text**")
    fireEvent.click(visualButton())
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Body" }).querySelector("strong")).not.toBeNull())
  })

  test("without the Markdown mode there is no switch", async () => {
    renderRichText(<Harness initial="a" allowMarkdownMode={false} />)
    await screen.findByRole("textbox", { name: "Body" })
    expect(screen.queryByRole("button", { name: "Markdown" })).toBeNull()
  })
})
