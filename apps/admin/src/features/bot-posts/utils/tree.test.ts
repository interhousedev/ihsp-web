import { describe, expect, test } from "bun:test"
import type { BotPostTreeNode } from "@ihsp/api"
import { canDeleteBotPost, findNode, flattenTree, moveTargets, siblingIds } from "./tree"

function node(id: string, children: BotPostTreeNode[] = [], isRoot = false): BotPostTreeNode {
  return {
    id,
    parent_id: isRoot ? null : "root",
    slug: id,
    title: { uz: id, ru: id, en: id },
    body: {},
    audience: "both",
    sort_order: 0,
    published: true,
    is_root: isRoot,
    buttons: [],
    children,
  }
}

const tree = node("root", [node("a", [node("a1")]), node("b"), node("c")], true)

describe("BOT-POSTS tree", () => {
  test("BOT-POSTS-5 flattens the tree in tree order and lists siblings in order", () => {
    expect(flattenTree(tree).map((post) => post.id)).toEqual(["root", "a", "a1", "b", "c"])
    expect(siblingIds(tree, "root")).toEqual(["a", "b", "c"])
    expect(findNode(tree, "a1")?.id).toBe("a1")
  })

  test("BOT-POSTS-6 the root cannot be deleted or moved", () => {
    expect(canDeleteBotPost(tree)).toBe(false)
    expect(moveTargets(tree, tree)).toEqual([])
  })

  test("BOT-POSTS-7 a post cannot be moved under itself or its own subtree", () => {
    const a = findNode(tree, "a")!

    expect(moveTargets(tree, a).map((post) => post.id)).toEqual(["root", "b", "c"])
  })
})
