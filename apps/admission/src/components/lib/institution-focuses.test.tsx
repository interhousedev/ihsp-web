import { describe, expect, it } from "bun:test"
import { screen } from "@testing-library/react"
import { renderAdmissionApp } from "../../tests/helpers"
import { InstitutionFocuses } from "./institution-focuses"

describe("InstitutionFocuses", () => {
  it("renders the paraphrase, the quote and a safe source link", () => {
    renderAdmissionApp(
      <InstitutionFocuses
        name="MIT"
        focuses={[{ text: "Hands-on making", quote: "We value building things.", source_url: "https://www.mit.edu/a" }]}
      />,
    )
    expect(screen.getByRole("heading", { name: "What MIT says it looks for" })).toBeTruthy()
    expect(screen.getByText("We value building things.").tagName).toBe("BLOCKQUOTE")
    const link = screen.getByRole("link", { name: /mit\.edu/ })
    expect(link.getAttribute("target")).toBe("_blank")
    expect(link.getAttribute("rel")).toBe("noopener noreferrer")
    expect(link.getAttribute("href")).toBe("https://www.mit.edu/a")
  })

  it("renders nothing when the list is empty", () => {
    const { container } = renderAdmissionApp(<InstitutionFocuses name="MIT" focuses={[]} />)
    expect(screen.queryByRole("heading")).toBeNull()
    expect(container.querySelector("[data-testid=institution-focuses]")).toBeNull()
  })
})
