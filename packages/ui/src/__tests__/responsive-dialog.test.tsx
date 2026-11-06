import { afterEach, describe, expect, it, mock } from "bun:test"
import { act, fireEvent, screen } from "@testing-library/react"
import { renderWithProviders } from "@ihsp/test-utils"
import { useState } from "react"
import { ResponsiveDialog } from "../components/responsive-dialog"

const DESKTOP = 1280
const PHONE = 360

function setWidth(width: number) {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: width })
  act(() => {
    window.dispatchEvent(new Event("resize"))
  })
}

afterEach(() => setWidth(DESKTOP))

function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{`count ${count}`}</button>
}

describe("ResponsiveDialog", () => {
  it("renders a centred dialog with the size preset on a desktop", () => {
    setWidth(DESKTOP)
    renderWithProviders(
      <ResponsiveDialog open onOpenChange={() => {}} title="Title" size="lg">
        body
      </ResponsiveDialog>,
    )
    const dialog = screen.getByRole("dialog", { name: "Title" })
    expect(dialog.getAttribute("data-slot")).toBe("dialog-content")
    expect(dialog.className).toContain("sm:max-w-3xl")
  })

  it("uses the small preset", () => {
    setWidth(DESKTOP)
    renderWithProviders(
      <ResponsiveDialog open onOpenChange={() => {}} title="Title" size="sm">
        body
      </ResponsiveDialog>,
    )
    expect(screen.getByRole("dialog", { name: "Title" }).className).toContain("sm:max-w-sm")
  })

  it("renders a bottom sheet with a 44 px close button on a phone", () => {
    setWidth(PHONE)
    renderWithProviders(
      <ResponsiveDialog open onOpenChange={() => {}} title="Title">
        body
      </ResponsiveDialog>,
    )
    expect(screen.getByRole("dialog", { name: "Title" }).getAttribute("data-slot")).toBe("drawer-popup")
    expect(screen.getByRole("button", { name: "Close" }).className).toContain("size-11")
  })

  it("keeps the footer above the home indicator on a phone", () => {
    setWidth(PHONE)
    renderWithProviders(
      <ResponsiveDialog open onOpenChange={() => {}} title="Title" footer={<button>Save</button>}>
        body
      </ResponsiveDialog>,
    )
    const footer = screen.getByRole("button", { name: "Save" }).parentElement
    expect(footer?.className).toContain("--safe-bottom")
  })

  it("does not remount the body when the width crosses the breakpoint while open", () => {
    setWidth(PHONE)
    renderWithProviders(
      <ResponsiveDialog open onOpenChange={() => {}} title="Title">
        <Counter />
      </ResponsiveDialog>,
    )
    fireEvent.click(screen.getByRole("button", { name: "count 0" }))
    setWidth(DESKTOP)
    expect(screen.getByRole("button", { name: "count 1" })).toBeTruthy()
    expect(screen.getByRole("dialog", { name: "Title" }).getAttribute("data-slot")).toBe("drawer-popup")
  })

  for (const width of [DESKTOP, PHONE]) {
    it(`submits the form from a footer button at ${width} px`, () => {
      setWidth(width)
      const submit = mock((event: { preventDefault: () => void }) => event.preventDefault())
      renderWithProviders(
        <ResponsiveDialog
          open
          onOpenChange={() => {}}
          title="Title"
          onSubmit={submit}
          footer={<button type="submit">Save</button>}
        >
          <input aria-label="Name" />
        </ResponsiveDialog>,
      )
      const form = screen.getByLabelText("Name").closest("form")
      expect(form?.contains(screen.getByRole("button", { name: "Save" }))).toBe(true)
      fireEvent.submit(form as HTMLFormElement)
      expect(submit).toHaveBeenCalledTimes(1)
    })

    it(`reports closing from the close button at ${width} px`, () => {
      setWidth(width)
      const onOpenChange = mock((_open: boolean) => {})
      renderWithProviders(
        <ResponsiveDialog open onOpenChange={onOpenChange} title="Title">
          body
        </ResponsiveDialog>,
      )
      fireEvent.click(screen.getByRole("button", { name: "Close" }))
      expect(onOpenChange.mock.calls[0]?.[0]).toBe(false)
    })
  }
})
