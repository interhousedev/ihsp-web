import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test"
import { renderWithProviders } from "@ihsp/test-utils"
import { useUnsavedGuard } from "../hooks/use-unsaved-guard"

function Guarded({ active = true }: { active?: boolean }) {
  useUnsavedGuard(active)
  return null
}

const realConfirm = window.confirm
let confirm: ReturnType<typeof mock>
let link: HTMLAnchorElement

function clickLink(init: MouseEventInit = {}) {
  const click = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0, ...init })
  // The guard listens in the capture phase; this reads its verdict, then stops happy-dom from really navigating.
  let defaultPrevented = false
  const read = (event: Event) => {
    defaultPrevented = event.defaultPrevented
    event.preventDefault()
  }
  link.addEventListener("click", read)
  link.dispatchEvent(click)
  link.removeEventListener("click", read)
  return { defaultPrevented }
}

beforeEach(() => {
  confirm = mock(() => false)
  window.confirm = confirm as unknown as typeof window.confirm
  link = document.createElement("a")
  link.href = "/other"
  document.body.append(link)
})

afterEach(() => {
  link.remove()
  window.confirm = realConfirm
})

describe("useUnsavedGuard", () => {
  it("asks nothing while inactive", () => {
    renderWithProviders(<Guarded active={false} />)
    expect(clickLink().defaultPrevented).toBe(false)
    expect(confirm).not.toHaveBeenCalled()
  })

  it("lets the link go when the user agrees", () => {
    confirm.mockImplementation(() => true)
    renderWithProviders(<Guarded />)
    expect(clickLink().defaultPrevented).toBe(false)
    expect(confirm).toHaveBeenCalledTimes(1)
  })

  it("does not ask for a click that opens another tab", () => {
    renderWithProviders(<Guarded />)
    clickLink({ metaKey: true })
    clickLink({ ctrlKey: true })
    clickLink({ button: 1 })
    expect(confirm).not.toHaveBeenCalled()
  })

  it("does not ask for links that keep the page", () => {
    renderWithProviders(<Guarded />)
    link.target = "_blank"
    clickLink()
    link.removeAttribute("target")
    link.setAttribute("download", "")
    clickLink()
    link.removeAttribute("download")
    link.href = "#section"
    clickLink()
    expect(confirm).not.toHaveBeenCalled()
  })

  it("does not ask for another origin, which beforeunload already guards", () => {
    renderWithProviders(<Guarded />)
    link.href = "https://elsewhere.test/"
    clickLink()
    expect(confirm).not.toHaveBeenCalled()
  })

  it("stops guarding after unmount", () => {
    const { unmount } = renderWithProviders(<Guarded />)
    unmount()
    expect(clickLink().defaultPrevented).toBe(false)
    expect(confirm).not.toHaveBeenCalled()
  })
})
