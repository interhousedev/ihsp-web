import type { MindMapLayout } from "./layout"

/** What a key press on a node should do. */
export type NavAction =
  | { type: "focus"; id: string }
  | { type: "expand"; id: string }
  | { type: "collapse"; id: string }
  | { type: "toggle"; id: string }
  | { type: "open"; id: string }
  | { type: "close" }

/**
 * Keyboard model of the tree (WAI-ARIA tree pattern on a horizontal map):
 * Up and Down move to the neighbour in the same column, Right expands or enters the first child, Left collapses or
 * goes to the parent, Enter toggles a branch (and opens the details of a leaf), Space opens the details,
 * Home and End jump to the first and last visible node, Escape closes the details.
 * Returns `null` for keys that do nothing.
 */
export function navigate(layout: MindMapLayout, activeId: string, key: string): NavAction | null {
  const index = layout.nodes.findIndex((item) => item.id === activeId)
  const current = layout.nodes[index]
  if (!current) return null

  switch (key) {
    case "ArrowDown":
    case "ArrowUp": {
      const column = layout.nodes.filter((item) => item.depth === current.depth)
      const target = column[column.indexOf(current) + (key === "ArrowDown" ? 1 : -1)]
      return target ? { type: "focus", id: target.id } : null
    }
    case "ArrowRight": {
      if (!current.hasChildren) return null
      if (current.collapsed) return { type: "expand", id: current.id }
      const child = layout.nodes.find((item) => item.parentId === current.id)
      return child ? { type: "focus", id: child.id } : null
    }
    case "ArrowLeft": {
      if (current.hasChildren && !current.collapsed) return { type: "collapse", id: current.id }
      return current.parentId ? { type: "focus", id: current.parentId } : null
    }
    case "Enter":
      return current.hasChildren ? { type: "toggle", id: current.id } : { type: "open", id: current.id }
    case " ":
    case "Spacebar":
      return { type: "open", id: current.id }
    case "Home": {
      const first = layout.nodes[0]
      return first ? { type: "focus", id: first.id } : null
    }
    case "End": {
      const last = layout.nodes[layout.nodes.length - 1]
      return last ? { type: "focus", id: last.id } : null
    }
    case "Escape":
      return { type: "close" }
    default:
      return null
  }
}
