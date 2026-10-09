import { describe, expect, it } from "bun:test"
import { isTypingTarget, keyAction } from "./reader-keys"

const press = (
  key: string,
  modifiers: Partial<{ shiftKey: boolean; ctrlKey: boolean; metaKey: boolean; altKey: boolean }> = {},
) => keyAction({ key, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false, ...modifiers })

describe("keyAction", () => {
  it("maps the arrows and page keys to turning pages", () => {
    expect(press("ArrowRight")).toBe("next")
    expect(press("PageDown")).toBe("next")
    expect(press(" ")).toBe("next")
    expect(press("ArrowLeft")).toBe("prev")
    expect(press("PageUp")).toBe("prev")
    expect(press(" ", { shiftKey: true })).toBe("prev")
    expect(press("Home")).toBe("first")
    expect(press("End")).toBe("last")
  })

  it("maps the letters of the design: / search, g go to, h highlight, n note", () => {
    expect(press("/")).toBe("search")
    expect(press("g")).toBe("goto")
    expect(press("G")).toBe("goto")
    expect(press("h")).toBe("highlight")
    expect(press("n")).toBe("note")
    expect(press("b")).toBe("bookmark")
    expect(press("Escape")).toBe("escape")
  })

  it("maps plus and minus to zoom", () => {
    expect(press("+")).toBe("zoom-in")
    expect(press("=")).toBe("zoom-in")
    expect(press("-")).toBe("zoom-out")
  })

  it("leaves shortcuts with Ctrl, Cmd or Alt to the browser", () => {
    expect(press("h", { ctrlKey: true })).toBeNull()
    expect(press("n", { metaKey: true })).toBeNull()
    expect(press("ArrowLeft", { altKey: true })).toBeNull()
  })

  it("ignores the keys it does not use", () => {
    expect(press("x")).toBeNull()
    expect(press("Enter")).toBeNull()
    expect(press("Tab")).toBeNull()
  })
})

function make(html: string): Element {
  const host = document.createElement("div")
  host.innerHTML = html
  document.body.append(host)
  return host.firstElementChild!.querySelector("[data-target]") ?? host.firstElementChild!
}

describe("isTypingTarget", () => {
  it("is true for fields and for anything inside a dialog, a menu or a slider", () => {
    expect(isTypingTarget(make("<input />"))).toBe(true)
    expect(isTypingTarget(make("<textarea></textarea>"))).toBe(true)
    expect(isTypingTarget(make("<select></select>"))).toBe(true)
    expect(isTypingTarget(make("<div contenteditable='true'></div>"))).toBe(true)
    expect(isTypingTarget(make("<div role='dialog'><button data-target>OK</button></div>"))).toBe(true)
    expect(isTypingTarget(make("<div role='menu'><button data-target>Item</button></div>"))).toBe(true)
    expect(isTypingTarget(make("<div role='slider'></div>"))).toBe(true)
  })

  it("is false for the page and for plain buttons", () => {
    expect(isTypingTarget(document.body)).toBe(false)
    expect(isTypingTarget(make("<button>Next</button>"))).toBe(false)
    expect(isTypingTarget(null)).toBe(false)
  })
})
