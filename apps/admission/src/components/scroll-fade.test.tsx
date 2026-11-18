import { fireEvent, render } from "@testing-library/react"
import { afterEach, describe, expect, test } from "bun:test"
import { ScrollFade } from "./scroll-fade"

const proto = HTMLElement.prototype
const saved = {
  scrollHeight: Object.getOwnPropertyDescriptor(proto, "scrollHeight"),
  clientHeight: Object.getOwnPropertyDescriptor(proto, "clientHeight"),
}

// The stubs live on the shared prototype: put the originals back so later files see real layout values.
afterEach(() => {
  for (const [name, descriptor] of Object.entries(saved)) {
    if (descriptor) Object.defineProperty(proto, name, descriptor)
    else Reflect.deleteProperty(proto, name)
  }
})

function setup(scrollHeight: number, clientHeight: number) {
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
