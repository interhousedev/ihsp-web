import { describe, expect, it } from "bun:test"
import { MIN_CONTENT_SCALE, findScale, measureContentScale } from "./shrink-to-fit"

describe("findScale", () => {
  it("leaves content that fits alone", () => {
    expect(findScale(() => true)).toBe(1)
  })

  it("finds the largest scale that fits, rounded down so that it surely fits", () => {
    const scale = findScale((candidate) => candidate <= 0.8)

    expect(scale).toBeLessThanOrEqual(0.8)
    expect(scale).toBeGreaterThan(0.77)
  })

  it("does not go below the readable minimum", () => {
    expect(findScale((candidate) => candidate <= 0.1)).toBe(MIN_CONTENT_SCALE)
    expect(findScale(() => false)).toBe(MIN_CONTENT_SCALE)
  })

  it("asks only a few times", () => {
    let calls = 0
    findScale((candidate) => {
      calls += 1
      return candidate <= 0.7
    })

    expect(calls).toBeLessThanOrEqual(10)
  })
})

describe("measureContentScale", () => {
  it("is 1 for a canvas that is not laid out (happy-dom has no layout)", () => {
    const root = document.createElement("div")
    root.innerHTML = "<div data-ig-content>text</div>"
    document.body.append(root)

    expect(measureContentScale(root)).toBe(1)
    root.remove()
  })

  it("is 1 without a content wrapper", () => {
    expect(measureContentScale(document.createElement("div"))).toBe(1)
  })

  it("puts the style of the content back after measuring", () => {
    const root = document.createElement("div")
    root.innerHTML = '<div data-ig-content style="transform: scale(0.9); width: 111%">text</div>'
    document.body.append(root)

    measureContentScale(root)

    const content = root.querySelector<HTMLElement>("[data-ig-content]")
    expect(content?.style.transform).toBe("scale(0.9)")
    expect(content?.style.width).toBe("111%")
    root.remove()
  })
})
