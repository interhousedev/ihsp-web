import { screen } from "@testing-library/react"
import { describe, expect, test } from "bun:test"
import { renderAdmissionApp } from "../../../tests/helpers"
import { FactSource, SourceChip } from "./fact-source"

describe("source links", () => {
  test.each(["javascript:alert(1)", "http://example.com/x"])("SourceChip renders no link for %s", (url) => {
    renderAdmissionApp(<SourceChip url={url} year={2025} />)
    expect(screen.queryByRole("link")).toBeNull()
  })

  test.each(["javascript:alert(1)", "http://example.com/x"])("FactSource renders no link for %s", (url) => {
    renderAdmissionApp(<FactSource fact={{ verified: true }} source={{ key: "k", url, year: 2025 } as never} />)
    expect(screen.queryByRole("link")).toBeNull()
  })

  test("an https source keeps its link, target and rel", () => {
    renderAdmissionApp(<SourceChip url="https://example.edu/x" year={2025} />)
    const link = screen.getByRole("link")
    expect(link.getAttribute("href")).toBe("https://example.edu/x")
    expect(link.getAttribute("target")).toBe("_blank")
    expect(link.getAttribute("rel")).toBe("noopener noreferrer")
  })

  test("FactSource keeps an https link", () => {
    renderAdmissionApp(
      <FactSource fact={{ verified: true }} source={{ key: "k", url: "https://example.edu/x", year: 2025 } as never} />,
    )
    expect(screen.getByRole("link").getAttribute("href")).toBe("https://example.edu/x")
  })
})
