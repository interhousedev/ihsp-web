import { afterEach, describe, expect, it } from "bun:test"
import { buildSvg, inlineComputedStyles, renderNodeToPng, serializeNode, svgDataUrl } from "./dom-to-png"

afterEach(() => {
  document.body.replaceChildren()
})

describe("buildSvg", () => {
  const svg = buildSvg({ width: 800, height: 1200, markup: '<div xmlns="http://www.w3.org/1999/xhtml">Hi</div>' })

  it("is an SVG of the canvas size", () => {
    expect(
      svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200" viewBox="0 0 800 1200">'),
    ).toBe(true)
    expect(svg.endsWith("</svg>")).toBe(true)
  })

  it("wraps the markup in a foreignObject that covers the SVG", () => {
    expect(svg).toContain(
      '<foreignObject x="0" y="0" width="800" height="1200"><div xmlns="http://www.w3.org/1999/xhtml">Hi</div></foreignObject>',
    )
  })
})

describe("svgDataUrl", () => {
  it("is a data URL that decodes back to the SVG", () => {
    const svg = buildSvg({ width: 10, height: 10, markup: "<p>#&amp; é</p>" })

    const url = svgDataUrl(svg)

    expect(url.startsWith("data:image/svg+xml;charset=utf-8,")).toBe(true)
    expect(decodeURIComponent(url.slice(url.indexOf(",") + 1))).toBe(svg)
    expect(url).not.toContain("#&")
  })
})

describe("serializeNode", () => {
  it("serializes as XHTML with the namespace", () => {
    const node = document.createElement("div")
    node.innerHTML = "<p>A &amp; B</p><br>"

    const markup = serializeNode(node)

    expect(markup).toContain('xmlns="http://www.w3.org/1999/xhtml"')
    expect(markup).toContain("<p>A &amp; B</p>")
    expect(markup).toMatch(/<br ?\/>/)
  })
})

describe("inlineComputedStyles", () => {
  it("copies the style of every element onto the clone", () => {
    const source = document.createElement("div")
    source.style.color = "rgb(255, 0, 0)"
    source.style.fontSize = "20px"
    source.innerHTML = '<span style="font-weight: 700">Bold</span>'
    document.body.append(source)
    const clone = source.cloneNode(true) as HTMLElement
    clone.removeAttribute("style")
    clone.querySelector("span")?.removeAttribute("style")

    inlineComputedStyles(source, clone)

    expect(clone.style.getPropertyValue("color")).toBe("rgb(255, 0, 0)")
    expect(clone.style.getPropertyValue("font-size")).toBe("20px")
    expect(clone.querySelector("span")?.style.getPropertyValue("font-weight")).toBe("700")
  })
})

describe("renderNodeToPng", () => {
  it("rejects where there is no canvas (happy-dom), so that the caller can fall back to printing", async () => {
    const node = document.createElement("div")
    document.body.append(node)

    await expect(renderNodeToPng(node, { width: 800, height: 1200 })).rejects.toThrow("canvas-unsupported")
  })
})
