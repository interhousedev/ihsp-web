import { describe, expect, it } from "bun:test"
import { renderWithProviders } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { ScrollList } from "../components/scroll-list"

describe("ScrollList", () => {
  it("is a named, keyboard focusable scroll region", () => {
    renderWithProviders(
      <ScrollList label="Needs attention">
        <p>one</p>
      </ScrollList>,
    )
    const region = screen.getByRole("region", { name: "Needs attention" })
    expect(region).toHaveAttribute("tabindex", "0")
    expect(region).toHaveClass("overflow-y-auto")
    region.focus()
    expect(document.activeElement).toBe(region)
  })

  it("caps the height with the default and with a given maxHeight", () => {
    const { unmount } = renderWithProviders(
      <ScrollList label="Default">
        <p>one</p>
      </ScrollList>,
    )
    expect(screen.getByRole("region", { name: "Default" })).toHaveClass("max-h-[min(60dvh,28rem)]")
    unmount()

    renderWithProviders(
      <ScrollList label="Custom" maxHeight="12rem">
        <p>one</p>
      </ScrollList>,
    )
    expect(screen.getByRole("region", { name: "Custom" }).style.maxHeight).toBe("12rem")
  })

  it("renders every child inside the scrolling region", () => {
    renderWithProviders(
      <ScrollList label="Items">
        {Array.from({ length: 30 }, (_, index) => (
          <p key={index}>item {index}</p>
        ))}
      </ScrollList>,
    )
    expect(screen.getByRole("region", { name: "Items" }).querySelectorAll("p")).toHaveLength(30)
  })
})
