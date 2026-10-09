import { describe, expect, it } from "bun:test"
import type { ManageTopic } from "@ihsp/api"
import { buildTopicTree, descendantCount } from "./topic-tree"

function topic(id: string, parent: string | null, position: number): ManageTopic {
  return {
    id,
    subject_id: "s1",
    parent_id: parent,
    name: { uz: id, ru: id, en: id },
    slug: id,
    position,
    year_of_study: null,
  }
}

describe("buildTopicTree", () => {
  it("nests children under their parent and orders siblings by position", () => {
    const tree = buildTopicTree([topic("b", null, 2), topic("a1", "a", 4), topic("a", null, 1), topic("a2", "a", 3)])

    expect(tree.map((node) => node.id)).toEqual(["a", "b"])
    expect(tree[0]?.children.map((node) => node.id)).toEqual(["a2", "a1"])
  })

  it("shows a topic whose parent is missing as a root", () => {
    const tree = buildTopicTree([topic("orphan", "gone", 1), topic("root", null, 2)])

    expect(tree.map((node) => node.id)).toEqual(["orphan", "root"])
  })

  it("is empty without topics", () => {
    expect(buildTopicTree([])).toEqual([])
  })
})

describe("descendantCount", () => {
  it("counts every topic below a node", () => {
    const [root] = buildTopicTree([topic("a", null, 1), topic("b", "a", 2), topic("c", "b", 3), topic("d", "a", 4)])

    expect(root && descendantCount(root)).toBe(3)
  })
})
