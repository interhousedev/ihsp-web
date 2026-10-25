import { describe, expect, test } from "bun:test"
import { renderWithProviders } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { TemporaryGpa } from "./temporary-gpa"

describe("TemporaryGpa", () => {
  test("renders the value as a superscript with a label", () => {
    renderWithProviders(<TemporaryGpa value={4.26} />)
    const sup = screen.getByTestId("temporary-gpa")
    expect(sup.tagName).toBe("SUP")
    expect(sup.textContent).toBe("4.3")
    expect(sup.getAttribute("aria-label")).toContain("temporary marks")
  })

  test("renders nothing for null and undefined", () => {
    const { container } = renderWithProviders(
      <>
        <TemporaryGpa value={null} />
        <TemporaryGpa value={undefined} />
      </>,
    )
    expect(screen.queryByTestId("temporary-gpa")).toBeNull()
    expect(container.textContent).toBe("")
  })
})
