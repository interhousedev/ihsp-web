import type { MindMapNode } from "@ihsp/api"
import type { Point } from "./transform"
/** A free text block: it hangs on the canvas and is not part of the tree. */
export type TextBlock = { id: string; text: string }

/**
 * What the student changed on a mind map. It lives in `progress_state` of the artifact:
 * `nodes` is the working copy of the tree (absent while untouched), `positions` the dragged pills and blocks by id,
 * `blocks` the free text blocks.
 */
export type MapEdits = {
  nodes: MindMapNode[] | null
  positions: Record<string, Point>
  blocks: TextBlock[]
}

export const NO_EDITS: MapEdits = { nodes: null, positions: {}, blocks: [] }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isNode(value: unknown): value is MindMapNode {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    (value.parent_id === null || typeof value.parent_id === "string")
  )
}

/** Reads the saved edits; anything that does not look right is ignored. */
export function parseEdits(state: Record<string, unknown> | null | undefined): MapEdits {
  if (!state) return NO_EDITS
  const nodes = Array.isArray(state.nodes) && state.nodes.every(isNode) ? (state.nodes as MindMapNode[]) : null
  const positions: Record<string, Point> = {}
  if (isRecord(state.positions)) {
    for (const [id, value] of Object.entries(state.positions)) {
      if (isRecord(value) && Number.isFinite(value.x) && Number.isFinite(value.y)) {
        positions[id] = { x: Number(value.x), y: Number(value.y) }
      }
    }
  }
  const blocks = Array.isArray(state.blocks)
    ? state.blocks.filter(
        (block): block is TextBlock =>
          isRecord(block) && typeof block.id === "string" && typeof block.text === "string",
      )
    : []
  return { nodes, positions, blocks }
}

/** The `progress_state` to save. */
export function serializeEdits(edits: MapEdits): Record<string, unknown> {
  const state: Record<string, unknown> = { positions: edits.positions }
  if (edits.nodes) state.nodes = edits.nodes
  if (edits.blocks.length > 0) state.blocks = edits.blocks
  return state
}

/** A fresh id (`n7`, `b2`) that no node, block or position uses. */
export function freshId(prefix: "n" | "b", taken: Iterable<string>): string {
  const used = new Set(taken)
  let index = 1
  while (used.has(`${prefix}${index}`)) index += 1
  return `${prefix}${index}`
}

export function takenIds(nodes: readonly MindMapNode[], blocks: readonly TextBlock[]): string[] {
  return [...nodes.map((node) => node.id), ...blocks.map((block) => block.id)]
}

export function newNode(id: string, parentId: string, label: string): MindMapNode {
  return { id, parent_id: parentId, label, note: "", refs: [] }
}

/** The node and every node below it. */
export function subtreeIds(nodes: readonly MindMapNode[], rootId: string): Set<string> {
  const ids = new Set([rootId])
  let grew = true
  while (grew) {
    grew = false
    for (const node of nodes) {
      if (node.parent_id !== null && ids.has(node.parent_id) && !ids.has(node.id)) {
        ids.add(node.id)
        grew = true
      }
    }
  }
  return ids
}

/** Removes a node with its branch; the root stays. Returns the ids that went. */
export function removeBranch(
  nodes: readonly MindMapNode[],
  id: string,
): { nodes: MindMapNode[]; removed: Set<string> } {
  const target = nodes.find((node) => node.id === id)
  if (!target || target.parent_id === null) return { nodes: [...nodes], removed: new Set() }
  const removed = subtreeIds(nodes, id)
  return { nodes: nodes.filter((node) => !removed.has(node.id)), removed }
}

export function withoutKeys<T>(record: Record<string, T>, keys: Iterable<string>): Record<string, T> {
  const drop = new Set(keys)
  return Object.fromEntries(Object.entries(record).filter(([key]) => !drop.has(key)))
}
