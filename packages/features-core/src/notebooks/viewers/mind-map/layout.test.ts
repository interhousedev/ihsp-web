import { describe, expect, test } from "bun:test"
import type { MindMapNode } from "@ihsp/api"
import { layoutMindMap, type MeasureNode, type MindMapLayout, type PositionedNode } from "./layout"

function node(id: string, parent_id: string | null, label = id): MindMapNode {
  return { id, parent_id, label, note: "", refs: [] }
}

/** Every pill is 100 x 40 unless its label is longer than 10 characters (then 200 wide). */
const measure: MeasureNode = (item) => ({
  width: item.label.length > 10 ? 200 : 100,
  height: 40,
})
const options = { columnGap: 50, rowGap: 10 }
/** Node c is much taller than the others. */
const tallC: MeasureNode = (item) => ({
  width: 100,
  height: item.id === "c" ? 120 : 30,
})

//        a
//      /   \
//     b     c
//    / \
//   d   e
const known = [node("a", null), node("b", "a"), node("c", "a"), node("d", "b"), node("e", "b")]

function find(layout: MindMapLayout, id: string): PositionedNode {
  const found = layout.nodes.find((item) => item.id === id)
  if (!found) throw new Error(`node ${id} is not in the layout`)
  return found
}

function noOverlap(layout: MindMapLayout) {
  for (const left of layout.nodes) {
    for (const right of layout.nodes) {
      if (left.id >= right.id) continue
      const apartX = left.x + left.width <= right.x || right.x + right.width <= left.x
      const apartY = left.y + left.height <= right.y || right.y + right.height <= left.y
      if (!apartX && !apartY) throw new Error(`${left.id} overlaps ${right.id}`)
    }
  }
}

describe("layoutMindMap", () => {
  test("puts the root at the left and one column per depth", () => {
    const layout = layoutMindMap(known, new Set(), measure, options)

    expect(find(layout, "a")).toMatchObject({
      x: 0,
      depth: 0,
      parentId: null,
      branch: null,
    })
    expect(find(layout, "b")).toMatchObject({
      x: 150,
      depth: 1,
      parentId: "a",
      branch: 0,
    })
    expect(find(layout, "c")).toMatchObject({ x: 150, depth: 1, branch: 1 })
    expect(find(layout, "d")).toMatchObject({
      x: 300,
      depth: 2,
      parentId: "b",
      branch: 0,
    })
    expect(find(layout, "e")).toMatchObject({ x: 300, depth: 2, branch: 0 })
  })

  test("stacks siblings with the row gap and centres parents on their children", () => {
    const layout = layoutMindMap(known, new Set(), measure, options)

    expect(find(layout, "d").y).toBe(0)
    expect(find(layout, "e").y).toBe(50)
    // b sits between d (centre 20) and e (centre 70).
    expect(find(layout, "b").y).toBe(25)
    expect(find(layout, "c").y).toBe(100)
    // a sits between b (centre 45) and c (centre 120).
    expect(find(layout, "a").y).toBe(62.5)
  })

  test("lists nodes depth first with sibling positions", () => {
    const layout = layoutMindMap(known, new Set(), measure, options)

    expect(layout.nodes.map((item) => item.id)).toEqual(["a", "b", "d", "e", "c"])
    expect(find(layout, "e")).toMatchObject({ position: 2, siblings: 2 })
    expect(find(layout, "a")).toMatchObject({ position: 1, siblings: 1 })
  })

  test("draws a smooth Bezier from the right edge of the parent to the left edge of the child", () => {
    const layout = layoutMindMap(known, new Set(), measure, options)
    const edge = layout.edges.find((item) => item.to === "b")

    expect(layout.edges).toHaveLength(4)
    expect(edge).toMatchObject({ from: "a", to: "b", branch: 0 })
    // a: right edge x=100, centre y=82.5; b: left edge x=150, centre y=45.
    expect(edge?.path).toBe("M 100 82.5 C 125 82.5, 125 45, 150 45")
  })

  test("is deterministic", () => {
    const first = layoutMindMap(known, new Set(["b"]), measure, options)
    const second = layoutMindMap(known, new Set(["b"]), measure, options)

    expect(second).toEqual(first)
  })

  test("a collapsed node hides its descendants and its edges", () => {
    const layout = layoutMindMap(known, new Set(["b"]), measure, options)

    expect(layout.nodes.map((item) => item.id)).toEqual(["a", "b", "c"])
    expect(layout.edges.map((item) => item.to)).toEqual(["b", "c"])
    expect(find(layout, "b")).toMatchObject({
      hasChildren: true,
      collapsed: true,
    })
    expect(find(layout, "c")).toMatchObject({
      hasChildren: false,
      collapsed: false,
    })
    expect(find(layout, "a")).toMatchObject({
      hasChildren: true,
      collapsed: false,
    })
  })

  test("collapsing shrinks the bounds and recentres the parent", () => {
    const open = layoutMindMap(known, new Set(), measure, options)
    const closed = layoutMindMap(known, new Set(["b"]), measure, options)

    expect(closed.bounds.height).toBeLessThan(open.bounds.height)
    expect(closed.bounds.width).toBeLessThan(open.bounds.width)
    // b (y 0) and c (y 50): a is centred on them.
    expect(find(closed, "b").y).toBe(0)
    expect(find(closed, "c").y).toBe(50)
    expect(find(closed, "a").y).toBe(25)
  })

  test("collapsing a node also hides the nodes below a collapsed descendant", () => {
    const deep = [...known, node("f", "d")]
    const layout = layoutMindMap(deep, new Set(["a"]), measure, options)

    expect(layout.nodes.map((item) => item.id)).toEqual(["a"])
    expect(layout.edges).toEqual([])
  })

  test("bounds enclose every pill", () => {
    const layout = layoutMindMap(known, new Set(), measure, options)

    expect(layout.bounds).toEqual({ x: 0, y: 0, width: 400, height: 140 })
    for (const item of layout.nodes) {
      expect(item.x).toBeGreaterThanOrEqual(layout.bounds.x)
      expect(item.y).toBeGreaterThanOrEqual(layout.bounds.y)
      expect(item.x + item.width).toBeLessThanOrEqual(layout.bounds.x + layout.bounds.width)
      expect(item.y + item.height).toBeLessThanOrEqual(layout.bounds.y + layout.bounds.height)
    }
  })

  test("pills of one column never overlap", () => {
    const wide = [
      node("r", null),
      ...Array.from({ length: 5 }, (_, i) => node(`m${i}`, "r")),
      ...Array.from({ length: 4 }, (_, i) => node(`x${i}`, "m1")),
      node("y0", "m3"),
      ...Array.from({ length: 3 }, (_, i) => node(`z${i}`, "x2")),
    ]
    const layout = layoutMindMap(wide, new Set(), measure, options)

    noOverlap(layout)
    const column = layout.nodes.filter((item) => item.depth === 2).map((item) => item.y)
    expect(column).toEqual(column.toSorted((a, b) => a - b))
  })

  test("mixed heights do not overlap either", () => {
    const layout = layoutMindMap(known, new Set(), tallC, options)

    noOverlap(layout)
    expect(find(layout, "c").height).toBe(120)
  })

  test("a long label widens only its node, and pushes the next column right", () => {
    const labelled = [node("a", null), node("b", "a", "A very long label here"), node("c", "a"), node("d", "b")]
    const layout = layoutMindMap(labelled, new Set(), measure, options)

    expect(find(layout, "b").width).toBe(200)
    expect(find(layout, "c").width).toBe(100)
    expect(find(layout, "a").width).toBe(100)
    // Both pills of the column start at the same x; the next column clears the widest one.
    expect(find(layout, "b").x).toBe(find(layout, "c").x)
    expect(find(layout, "d").x).toBe(find(layout, "b").x + 200 + 50)
  })

  test("a single node map", () => {
    const layout = layoutMindMap([node("a", null)], new Set(), measure, options)

    expect(layout.nodes).toHaveLength(1)
    expect(layout.edges).toEqual([])
    expect(layout.nodes[0]).toMatchObject({
      x: 0,
      y: 0,
      hasChildren: false,
      collapsed: false,
      depth: 0,
    })
    expect(layout.bounds).toEqual({ x: 0, y: 0, width: 100, height: 40 })
  })

  test("an empty or rootless map has an empty layout", () => {
    expect(layoutMindMap([], new Set(), measure).nodes).toEqual([])
    expect(layoutMindMap([node("b", "a")], new Set(), measure).bounds).toEqual({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    })
  })

  test("uses the default gaps without options", () => {
    const layout = layoutMindMap(known, new Set(), measure)

    expect(find(layout, "b").x).toBe(100 + 64)
    expect(find(layout, "e").y - find(layout, "d").y).toBe(40 + 14)
  })

  test("lays out 60 nodes quickly and without overlaps", () => {
    const big: MindMapNode[] = [node("root", null)]
    for (let branch = 0; branch < 6; branch++) {
      big.push(node(`b${branch}`, "root"))
      for (let child = 0; child < 3; child++) {
        big.push(node(`b${branch}c${child}`, `b${branch}`))
        for (let leaf = 0; leaf < 2; leaf++) big.push(node(`b${branch}c${child}l${leaf}`, `b${branch}c${child}`))
      }
    }
    expect(big).toHaveLength(61)

    const started = performance.now()
    const layout = layoutMindMap(big, new Set(), measure, options)
    const elapsed = performance.now() - started

    expect(layout.nodes).toHaveLength(61)
    expect(layout.edges).toHaveLength(60)
    expect(elapsed).toBeLessThan(100)
    noOverlap(layout)
  })
})
