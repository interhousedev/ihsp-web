import { describe, expect, test } from "bun:test"
import type { MindMapNode } from "@ihsp/api"
import { navigate } from "./keyboard-nav"
import { layoutMindMap } from "./layout"

function node(id: string, parent_id: string | null): MindMapNode {
  return { id, parent_id, label: id, note: "", refs: [] }
}

//        a
//      /   \
//     b     c
//    / \     \
//   d   e     f
const nodes = [node("a", null), node("b", "a"), node("c", "a"), node("d", "b"), node("e", "b"), node("f", "c")]
const measure = () => ({ width: 100, height: 40 })
const open = layoutMindMap(nodes, new Set(), measure)
const closed = layoutMindMap(nodes, new Set(["b", "c"]), measure)

describe("navigate", () => {
  test("Up and Down move within the column, across parents, and stop at the ends", () => {
    expect(navigate(open, "b", "ArrowDown")).toEqual({ type: "focus", id: "c" })
    expect(navigate(open, "c", "ArrowUp")).toEqual({ type: "focus", id: "b" })
    expect(navigate(open, "e", "ArrowDown")).toEqual({ type: "focus", id: "f" })
    expect(navigate(open, "f", "ArrowUp")).toEqual({ type: "focus", id: "e" })
    expect(navigate(open, "c", "ArrowDown")).toBeNull()
    expect(navigate(open, "a", "ArrowUp")).toBeNull()
    expect(navigate(open, "d", "ArrowUp")).toBeNull()
  })

  test("Right expands a collapsed branch, enters an open one, and does nothing on a leaf", () => {
    expect(navigate(closed, "b", "ArrowRight")).toEqual({ type: "expand", id: "b" })
    expect(navigate(open, "b", "ArrowRight")).toEqual({ type: "focus", id: "d" })
    expect(navigate(open, "a", "ArrowRight")).toEqual({ type: "focus", id: "b" })
    expect(navigate(open, "d", "ArrowRight")).toBeNull()
  })

  test("Left collapses an open branch, otherwise goes to the parent", () => {
    expect(navigate(open, "b", "ArrowLeft")).toEqual({ type: "collapse", id: "b" })
    expect(navigate(closed, "b", "ArrowLeft")).toEqual({ type: "focus", id: "a" })
    expect(navigate(open, "d", "ArrowLeft")).toEqual({ type: "focus", id: "b" })
    expect(navigate(closed, "a", "ArrowLeft")).toEqual({ type: "collapse", id: "a" })
    const single = layoutMindMap([node("a", null)], new Set(), measure)
    expect(navigate(single, "a", "ArrowLeft")).toBeNull()
  })

  test("Enter toggles a branch and opens the details of a leaf; Space always opens them", () => {
    expect(navigate(open, "b", "Enter")).toEqual({ type: "toggle", id: "b" })
    expect(navigate(open, "d", "Enter")).toEqual({ type: "open", id: "d" })
    expect(navigate(open, "b", " ")).toEqual({ type: "open", id: "b" })
  })

  test("Home and End jump to the first and last visible node", () => {
    expect(navigate(open, "e", "Home")).toEqual({ type: "focus", id: "a" })
    expect(navigate(open, "b", "End")).toEqual({ type: "focus", id: "f" })
    expect(navigate(closed, "a", "End")).toEqual({ type: "focus", id: "c" })
  })

  test("Escape closes the details; other keys and unknown nodes do nothing", () => {
    expect(navigate(open, "b", "Escape")).toEqual({ type: "close" })
    expect(navigate(open, "b", "x")).toBeNull()
    expect(navigate(open, "missing", "ArrowDown")).toBeNull()
  })
})
