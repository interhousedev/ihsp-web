/** The course tools strip scrolls sideways on a phone, with a fade only on the side that hides more tabs. */
import { describe, expect, test } from "bun:test"
import { fireEvent, screen } from "@testing-library/react"
import { EditorNav } from "../features/editor/components/editor-nav"
import { renderLms } from "./helpers"

const ALL = ["edit", "view_drafts", "publish", "review"] as const

function sizes(el: HTMLElement, scrollWidth: number, clientWidth: number, scrollLeft: number) {
  Object.defineProperty(el, "scrollWidth", { configurable: true, value: scrollWidth })
  Object.defineProperty(el, "clientWidth", { configurable: true, value: clientWidth })
  el.scrollLeft = scrollLeft
  fireEvent.scroll(el)
}

describe("EditorNav", () => {
  test("is a horizontal scroll container whose tabs do not shrink", () => {
    renderLms(<EditorNav courseId="c1" current="outline" permissions={[...ALL] as never} />)

    const nav = screen.getByTestId("editor-nav-scroll")
    expect(nav).toHaveClass("overflow-x-auto")
    expect(nav.querySelector("ul")).toHaveClass("min-w-max")
  })

  test("fades only the edge that still hides tabs", () => {
    renderLms(<EditorNav courseId="c1" current="outline" permissions={[...ALL] as never} />)
    const nav = screen.getByTestId("editor-nav-scroll")

    sizes(nav, 900, 390, 0)
    expect(screen.queryByTestId("nav-fade")).toBeNull()
    expect(screen.getByTestId("nav-fade-end")).toBeInTheDocument()

    sizes(nav, 900, 390, 200)
    expect(screen.getByTestId("nav-fade")).toBeInTheDocument()
    expect(screen.getByTestId("nav-fade-end")).toBeInTheDocument()

    sizes(nav, 900, 390, 510)
    expect(screen.getByTestId("nav-fade")).toBeInTheDocument()
    expect(screen.queryByTestId("nav-fade-end")).toBeNull()
  })
})
