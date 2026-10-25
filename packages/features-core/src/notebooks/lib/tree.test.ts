import { describe, expect, test } from "bun:test"
import type { MindMapNode } from "@ihsp/api"
import { branchIds, buildTree, collapsedBeyond, countNodes, toOutline, treeDepth } from "./tree"

function node(id: string, parent_id: string | null): MindMapNode {
  return { id, parent_id, label: id.toUpperCase(), note: "", refs: [] }
}

const nodes = [node("a", null), node("b", "a"), node("c", "a"), node("d", "b"), node("e", "d")]

describe("buildTree", () => {
  test("nests children under their parents in list order", () => {
    const tree = buildTree(nodes)

    expect(tree?.node.id).toBe("a")
    expect(tree?.children.map((child) => child.node.id)).toEqual(["b", "c"])
    expect(tree?.children[0]?.children[0]?.node.id).toBe("d")
  })

  test("numbers the first-level branches and passes the number down", () => {
    const tree = buildTree(nodes)

    expect(tree?.branch).toBeNull()
    expect(tree?.children.map((child) => child.branch)).toEqual([0, 1])
    expect(tree?.children[0]?.children[0]?.branch).toBe(0)
  })

  test("returns null without a root and drops nodes whose parent is missing", () => {
    expect(buildTree([node("b", "a")])).toBeNull()
    expect(countNodes(buildTree([node("a", null), node("x", "missing")])!)).toBe(1)
  })

  test("does not loop on a cycle", () => {
    const cyclic = [node("a", null), node("b", "c"), node("c", "b")]

    expect(countNodes(buildTree(cyclic)!)).toBe(1)
  })
})

describe("tree helpers", () => {
  const tree = buildTree(nodes)!

  test("depth and count", () => {
    expect(treeDepth(tree)).toBe(3)
    expect(countNodes(tree)).toBe(5)
  })

  test("branchIds lists nodes that have children", () => {
    expect(branchIds(tree)).toEqual(["a", "b", "d"])
  })

  test("collapsedBeyond keeps the first two levels open", () => {
    expect([...collapsedBeyond(tree, 2)]).toEqual(["b", "d"])
  })

  test("toOutline indents by depth", () => {
    expect(toOutline(tree)).toBe("- A\n  - B\n    - D\n      - E\n  - C")
  })
})
