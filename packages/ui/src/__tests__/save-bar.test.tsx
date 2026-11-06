import { describe, expect, it, mock } from "bun:test"
import { renderWithProviders } from "@ihsp/test-utils"
import { fireEvent, screen } from "@testing-library/react"
import { SaveBar } from "../components/ui/save-bar"

function leavingIsCancelled() {
  const event = new Event("beforeunload", { cancelable: true })
  window.dispatchEvent(event)
  return event.defaultPrevented
}

describe("SaveBar", () => {
  it("offers Save and Discard only while there are edits", () => {
    const { rerender } = renderWithProviders(
      <SaveBar dirty={false} saving={false} onSave={() => {}} onDiscard={() => {}} />,
    )
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled()
    expect(screen.getByText("All changes saved")).toBeInTheDocument()
    rerender(<SaveBar dirty saving={false} onSave={() => {}} onDiscard={() => {}} />)
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled()
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument()
  })

  it("calls onSave and shows the error of a failed save", () => {
    const onSave = mock(() => {})
    renderWithProviders(<SaveBar dirty saving={false} onSave={onSave} error="Could not save" />)
    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(screen.getByRole("alert")).toHaveTextContent("Could not save")
  })

  it("sits above the bottom navigation and the safe area", () => {
    renderWithProviders(<SaveBar dirty saving={false} onSave={() => {}} />)
    expect(screen.getByTestId("save-bar").className).toContain("--save-bar-bottom")
  })

  it("asks before the tab closes only while dirty", () => {
    const { rerender } = renderWithProviders(<SaveBar dirty saving={false} onSave={() => {}} />)
    expect(leavingIsCancelled()).toBe(true)
    rerender(<SaveBar dirty={false} saving={false} onSave={() => {}} />)
    expect(leavingIsCancelled()).toBe(false)
  })

  it("keeps the page when an in-app link is refused", () => {
    const original = window.confirm
    window.confirm = () => false
    renderWithProviders(<SaveBar dirty saving={false} onSave={() => {}} />)
    const link = document.createElement("a")
    link.href = "/other"
    document.body.append(link)
    const click = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 })
    link.dispatchEvent(click)
    expect(click.defaultPrevented).toBe(true)
    link.remove()
    window.confirm = original
  })
})
