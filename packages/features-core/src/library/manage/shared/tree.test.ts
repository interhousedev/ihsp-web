import { describe, expect, it } from "bun:test"
import { buildTree, descendantCount, reorderPatches, subtreeIds, type TreeItem } from "./tree"

const row = (id: string, parent: string | null, position: number): TreeItem & { name: string } => ({
  id,
  parent_id: parent,
  position,
  name: id,
})

describe("buildTree", () => {
  it("nests children under their parent in position order and keeps orphans as roots", () => {
    const tree = buildTree([
      row("b", null, 2),
      row("a1", "a", 4),
      row("a", null, 1),
      row("a2", "a", 3),
      row("x", "gone", 0),
    ])

    expect(tree.map((node) => node.id)).toEqual(["x", "a", "b"])
    expect(tree[1]?.children.map((node) => node.id)).toEqual(["a2", "a1"])
    expect(descendantCount(tree[1]!)).toBe(2)
  })
})

describe("subtreeIds", () => {
  it("returns the node and every descendant, not its siblings", () => {
    const rows = [row("root", null, 0), row("kid", "root", 0), row("grandkid", "kid", 0), row("other", null, 1)]
    expect([...subtreeIds(rows, "root")].toSorted()).toEqual(["grandkid", "kid", "root"])
  })
})

describe("reorderPatches", () => {
  it("swaps a row with its previous sibling and renumbers only what moved", () => {
    const rows = [row("a", null, 0), row("b", null, 1), row("c", null, 2)]
    expect(reorderPatches(rows, "b", -1)).toEqual([
      { id: "b", position: 0 },
      { id: "a", position: 1 },
    ])
  })

  it("moves among siblings only, and does nothing at an edge", () => {
    const rows = [row("p", null, 0), row("c1", "p", 0), row("c2", "p", 1), row("q", null, 1)]
    expect(reorderPatches(rows, "c2", 1)).toEqual([])
    expect(reorderPatches(rows, "c1", 1)).toEqual([
      { id: "c2", position: 0 },
      { id: "c1", position: 1 },
    ])
    expect(reorderPatches(rows, "p", -1)).toEqual([])
  })

  it("renumbers gaps so that the order is kept without ties", () => {
    const rows = [row("a", null, 5), row("b", null, 9)]
    expect(reorderPatches(rows, "b", -1)).toEqual([
      { id: "b", position: 0 },
      { id: "a", position: 1 },
    ])
  })
})
