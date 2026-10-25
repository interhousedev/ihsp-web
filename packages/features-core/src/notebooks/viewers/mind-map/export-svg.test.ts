import { describe, expect, test } from "bun:test"
import type { MindMapNode } from "@ihsp/api"
import { LIGHT_PALETTE, buildMindMapSvg, escapeXml, type ExportPalette } from "./export-svg"
import { layoutMindMap } from "./layout"
import { measureNode } from "./node-metrics"

function node(id: string, parent_id: string | null, label = id): MindMapNode {
  return { id, parent_id, label, note: "", refs: [] }
}

const palette: ExportPalette = {
  background: "rgb(250, 250, 250)",
  foreground: "rgb(10, 10, 10)",
  primary: "rgb(1, 2, 3)",
  primaryForeground: "rgb(255, 255, 255)",
  branches: ["rgb(11, 0, 0)", "rgb(0, 22, 0)", "rgb(0, 0, 33)", "rgb(44, 44, 0)", "rgb(0, 55, 55)"],
  fontFamily: "Geist, sans-serif",
}

/** The first two x coordinates of the chevron in the expand control (after the first circle). */
const chevron = (out: string) => /<path d="M (\S+) (\S+) L (\S+) /.exec(out)

const nodes = [node("a", null, "Root"), node("b", "a", "Left"), node("c", "a", "Right"), node("d", "b", "Leaf")]

describe("buildMindMapSvg", () => {
  const layout = layoutMindMap(nodes, new Set(["b"]), measureNode)
  const { svg, width, height } = buildMindMapSvg(layout, palette, 24)

  test("is a standalone SVG with the size of the map plus padding", () => {
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true)
    expect(svg.endsWith("</svg>")).toBe(true)
    expect(width).toBe(Math.ceil(layout.bounds.width + 48 + 10))
    expect(height).toBe(Math.ceil(layout.bounds.height + 48))
    expect(svg).toContain(`width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"`)
    expect(svg).toContain('font-family="Geist, sans-serif"')
  })

  test("paints a solid background so the PNG is not transparent", () => {
    expect(svg).toContain(`<rect width="${width}" height="${height}" fill="rgb(250, 250, 250)"/>`)
  })

  test("draws one pill and one text per visible node, and one path per edge", () => {
    expect(layout.nodes).toHaveLength(3)
    expect(svg.match(/rx="/g)).toHaveLength(3)
    expect(svg.match(/<text /g)).toHaveLength(3)
    expect(svg.match(/stroke-opacity="0.7"/g)).toHaveLength(2)
    expect(svg).toContain(">Root</text>")
    expect(svg).not.toContain(">Leaf</text>")
  })

  test("resolves the colours: the root is primary, branches use their own colour, nothing is a CSS variable", () => {
    expect(svg).toContain('fill="rgb(1, 2, 3)"')
    expect(svg).toContain('fill="rgb(255, 255, 255)"')
    expect(svg).toContain('stroke="rgb(11, 0, 0)"')
    expect(svg).toContain('stroke="rgb(0, 22, 0)"')
    expect(svg).not.toContain("var(")
  })

  test("draws the expand control on branches only, with a chevron that points the way it will move", () => {
    const pair = [node("a", null, "Root"), node("b", "a", "Child")]
    const collapsed = buildMindMapSvg(layoutMindMap(pair, new Set(["a"]), measureNode), palette).svg
    const expanded = buildMindMapSvg(layoutMindMap(pair, new Set(), measureNode), palette).svg
    const leaf = buildMindMapSvg(layoutMindMap([node("a", null)], new Set(), measureNode), palette).svg

    expect(collapsed.match(/<circle /g)).toHaveLength(1)
    expect(expanded.match(/<circle /g)).toHaveLength(1)
    expect(leaf).not.toContain("<circle ")
    const [, collapsedFrom, , collapsedTo] = chevron(collapsed.slice(collapsed.indexOf("<circle"))) ?? []
    const [, expandedFrom, , expandedTo] = chevron(expanded.slice(expanded.indexOf("<circle"))) ?? []
    expect(Number(collapsedTo)).toBeGreaterThan(Number(collapsedFrom))
    expect(Number(expandedTo)).toBeLessThan(Number(expandedFrom))
  })

  test("escapes the label", () => {
    const tricky = layoutMindMap([node("a", null, 'R&D <b> "x"')], new Set(), measureNode)

    const out = buildMindMapSvg(tricky, palette).svg

    expect(out).toContain("R&amp;D &lt;b&gt; &quot;x&quot;")
    expect(out).not.toContain("<b>")
  })

  test("cycles the branch colours after five branches", () => {
    const many = [node("r", null), ...Array.from({ length: 6 }, (_, i) => node(`n${i}`, "r"))]
    const out = buildMindMapSvg(layoutMindMap(many, new Set(), measureNode), palette).svg

    // Branch 5 reuses the colour of branch 0: it appears on its pill and its edge.
    expect(out.match(/stroke="rgb\(11, 0, 0\)"/g)!.length).toBeGreaterThanOrEqual(4)
  })

  test("is deterministic and works for an empty map", () => {
    expect(buildMindMapSvg(layout, palette).svg).toBe(svg)
    const empty = buildMindMapSvg(layoutMindMap([], new Set(), measureNode), LIGHT_PALETTE)
    expect(empty.svg).toContain("<svg")
    expect(empty.width).toBeGreaterThan(0)
  })
})

describe("escapeXml", () => {
  test("escapes the five XML characters", () => {
    expect(escapeXml(`<a href="x">Tom & 'Jerry'</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;Tom &amp; &apos;Jerry&apos;&lt;/a&gt;",
    )
  })
})
