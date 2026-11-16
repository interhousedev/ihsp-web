import { fireEvent, render } from "@testing-library/react"
import { describe, expect, test } from "bun:test"
import { ScrollFade } from "./scroll-fade"

function setup(scrollHeight: number, clientHeight: number) {
  const proto = HTMLElement.prototype
  Object.defineProperty(proto, "scrollHeight", { configurable: true, get: () => scrollHeight })
  Object.defineProperty(proto, "clientHeight", { configurable: true, get: () => clientHeight })
  return render(
    <ScrollFade maxHeight={100}>
      <p>row</p>
    </ScrollFade>,
  )
}

describe("ScrollFade", () => {
  test("no masks when content fits", () => {
    const { container } = setup(100, 100)
    expect(container.querySelector("[data-scroll-fade]")).toBeNull()
  })

  test("bottom mask only at the top of an overflowing list, both in the middle", () => {
    const { container } = setup(300, 100)
    expect(container.querySelector('[data-scroll-fade="bottom"]')).not.toBeNull()
    expect(container.querySelector('[data-scroll-fade="top"]')).toBeNull()
    const scroller = container.querySelector("[tabindex]") as HTMLElement
    scroller.scrollTop = 50
    fireEvent.scroll(scroller)
    expect(container.querySelector('[data-scroll-fade="top"]')).not.toBeNull()
    expect(container.querySelector('[data-scroll-fade="bottom"]')).not.toBeNull()
    scroller.scrollTop = 200
    fireEvent.scroll(scroller)
    expect(container.querySelector('[data-scroll-fade="bottom"]')).toBeNull()
  })
})
