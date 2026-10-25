"use client"

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react"
import { navigate } from "./keyboard-nav"
import type { MindMapTreeState } from "./use-mind-map-tree"
import type { Bounds } from "./layout"
import type { Transform } from "./transform"

type PanZoomApi = {
  fit: (animated?: boolean, box?: Bounds) => void
  shiftBy: (dx: number, dy: number) => void
  reveal: (box: Bounds) => void
  wasDragged: () => boolean
  getTransform: () => Transform
}

/**
 * Which node is the tab stop and which one has its details open, the keyboard model of the tree, and the commands
 * that change what is expanded. The callbacks it returns stay stable while the user pans, so the memoized graph does
 * not re-render.
 */
export function useMindMapNavigation(state: MindMapTreeState, panZoom: PanZoomApi) {
  const { layout, layoutFor, collapsed, setCollapsed, rootId, allCollapsed } = state
  const { fit, shiftBy, reveal, wasDragged, getTransform } = panZoom
  const [activeRaw, setActiveId] = useState(rootId ?? "")
  const [selectedRaw, setSelectedId] = useState<string | null>(null)
  const nodes = useRef(new Map<string, SVGGElement>())
  const pendingFocus = useRef<string | null>(null)

  // A node that is no longer visible (its branch was collapsed) hands the tab stop back to the root.
  const isVisible = (id: string | null) => id !== null && layout.nodes.some((item) => item.id === id)
  const activeId = isVisible(activeRaw) ? activeRaw : (rootId ?? "")
  const selectedId = isVisible(selectedRaw) ? selectedRaw : null

  const registerNode = useCallback((id: string, element: SVGGElement | null) => {
    if (element) nodes.current.set(id, element)
    else nodes.current.delete(id)
  }, [])

  // Moves DOM focus after the render that made the target the tab stop.
  useEffect(() => {
    const id = pendingFocus.current
    if (!id) return
    pendingFocus.current = null
    nodes.current.get(id)?.focus()
  })

  /** Applies a new set of collapsed branches and keeps `anchorId` where it is on the screen. */
  const applyCollapsed = useCallback(
    (next: ReadonlySet<string>, anchorId: string) => {
      const before = layout.nodes.find((item) => item.id === anchorId)
      const after = layoutFor(next).nodes.find((item) => item.id === anchorId)
      setCollapsed(next)
      if (before && after) {
        const { k } = getTransform()
        shiftBy(-(after.x - before.x) * k, -(after.y - before.y) * k)
      }
    },
    [layout, layoutFor, setCollapsed, shiftBy, getTransform],
  )

  const setBranch = useCallback(
    (id: string, open: boolean) => {
      const next = new Set(collapsed)
      if (open) next.delete(id)
      else next.add(id)
      applyCollapsed(next, id)
    },
    [collapsed, applyCollapsed],
  )

  const toggle = useCallback((id: string) => setBranch(id, collapsed.has(id)), [collapsed, setBranch])

  const expandAll = useCallback(() => {
    const next = new Set<string>()
    setCollapsed(next)
    fit(true, layoutFor(next).bounds)
  }, [setCollapsed, fit, layoutFor])

  const collapseAll = useCallback(() => {
    setCollapsed(allCollapsed)
    fit(true, layoutFor(allCollapsed).bounds)
  }, [setCollapsed, allCollapsed, fit, layoutFor])

  const onSelect = useCallback(
    (id: string) => {
      if (wasDragged()) return
      setActiveId(id)
      setSelectedId((current) => (current === id ? null : id))
    },
    [wasDragged],
  )

  const onToggle = useCallback(
    (id: string) => {
      if (wasDragged()) return
      toggle(id)
    },
    [wasDragged, toggle],
  )

  const onFocusNode = useCallback((id: string) => setActiveId(id), [])

  const closeDetails = useCallback(() => {
    setSelectedId(null)
    pendingFocus.current = selectedId
  }, [selectedId])

  const clearSelection = useCallback(() => setSelectedId(null), [])

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      const action = navigate(layout, activeId, event.key)
      if (!action) return
      event.preventDefault()
      switch (action.type) {
        case "focus": {
          const target = layout.nodes.find((item) => item.id === action.id)
          setActiveId(action.id)
          pendingFocus.current = action.id
          if (target) reveal(target)
          break
        }
        case "expand":
          setBranch(action.id, true)
          break
        case "collapse":
          setBranch(action.id, false)
          break
        case "toggle":
          toggle(action.id)
          break
        case "open":
          setSelectedId(action.id)
          break
        case "close":
          if (selectedId) closeDetails()
          break
      }
    },
    [layout, activeId, selectedId, reveal, setBranch, toggle, closeDetails],
  )

  return {
    activeId,
    selectedId,
    registerNode,
    onSelect,
    onToggle,
    onFocusNode,
    onKeyDown,
    toggle,
    expandAll,
    collapseAll,
    closeDetails,
    clearSelection,
  }
}
