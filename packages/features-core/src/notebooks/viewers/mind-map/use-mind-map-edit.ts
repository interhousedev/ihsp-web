"use client"

import type { MindMapNode } from "@ihsp/api"
import { useCallback, useRef, useState } from "react"
import { useDebouncedProgress } from "../use-debounced-progress"
import {
  freshId,
  newNode,
  parseEdits,
  removeBranch,
  serializeEdits,
  takenIds,
  withoutKeys,
  type MapEdits,
} from "./edit-state"
import type { Point } from "./transform"

type EditArgs = {
  notebookId: string
  artifactId: string
  /** The nodes the model generated. */
  original: readonly MindMapNode[]
  /** `progress_state` of the artifact. */
  saved: Record<string, unknown> | null
  /** The label of a node or block that was just added. */
  labels: { node: string; block: string }
}

/**
 * The student's changes to a mind map: dragged positions, added, renamed and removed nodes and free text blocks. Every
 * change is saved (debounced) as `progress_state` of the artifact; `tidy` throws the positions away so the automatic
 * layout takes over again.
 */
export function useMindMapEdit({ notebookId, artifactId, original, saved, labels }: EditArgs) {
  const [edits, setEdits] = useState<MapEdits>(() => parseEdits(saved))
  const latest = useRef(edits)
  const save = useDebouncedProgress(notebookId, artifactId)

  const commit = useCallback(
    (update: (current: MapEdits) => MapEdits) => {
      const next = update(latest.current)
      latest.current = next
      setEdits(next)
      save(serializeEdits(next))
    },
    [save],
  )

  const nodes = edits.nodes ?? original

  const moveTo = useCallback(
    (id: string, at: Point) =>
      commit((current) => ({
        ...current,
        positions: { ...current.positions, [id]: at },
      })),
    [commit],
  )

  /** Adds a child (or a sibling); returns the new id. `at` places it when the map is laid out by hand. */
  const addNode = useCallback(
    (parentId: string, at?: Point): string => {
      const current = latest.current
      const list = current.nodes ?? original
      const id = freshId("n", takenIds(list, current.blocks))
      commit((state) => ({
        ...state,
        nodes: [...(state.nodes ?? original), newNode(id, parentId, labels.node)],
        positions: at ? { ...state.positions, [id]: at } : state.positions,
      }))
      return id
    },
    [commit, labels.node, original],
  )

  const renameNode = useCallback(
    (id: string, label: string) =>
      commit((state) => ({
        ...state,
        nodes: (state.nodes ?? original).map((node) => (node.id === id ? { ...node, label } : node)),
      })),
    [commit, original],
  )

  const removeNode = useCallback(
    (id: string) =>
      commit((state) => {
        const { nodes: kept, removed } = removeBranch(state.nodes ?? original, id)
        return {
          ...state,
          nodes: kept,
          positions: withoutKeys(state.positions, removed),
        }
      }),
    [commit, original],
  )

  const addBlock = useCallback((): string => {
    const current = latest.current
    const id = freshId("b", takenIds(current.nodes ?? original, current.blocks))
    commit((state) => ({
      ...state,
      blocks: [...state.blocks, { id, text: labels.block }],
    }))
    return id
  }, [commit, labels.block, original])

  const renameBlock = useCallback(
    (id: string, text: string) =>
      commit((state) => ({
        ...state,
        blocks: state.blocks.map((block) => (block.id === id ? { ...block, text } : block)),
      })),
    [commit],
  )

  const removeBlock = useCallback(
    (id: string) =>
      commit((state) => ({
        ...state,
        blocks: state.blocks.filter((block) => block.id !== id),
        positions: withoutKeys(state.positions, [id]),
      })),
    [commit],
  )

  /** «Сжать»: the automatic layout again. Added nodes and blocks stay; only the positions go. */
  const tidy = useCallback(() => commit((state) => ({ ...state, positions: {} })), [commit])

  return {
    nodes,
    positions: edits.positions,
    blocks: edits.blocks,
    moveTo,
    addNode,
    renameNode,
    removeNode,
    addBlock,
    renameBlock,
    removeBlock,
    tidy,
  }
}

export type MindMapEdit = ReturnType<typeof useMindMapEdit>
