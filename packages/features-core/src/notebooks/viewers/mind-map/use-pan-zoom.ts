"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import type { Bounds } from "./layout"
import { IDENTITY, ZOOM_STEP, fitTransform, panIntoView, zoomAt, type Size, type Transform } from "./transform"
import { useCanvasGestures } from "./use-canvas-gestures"

/** Used when the canvas has no size yet (hidden, or a test DOM without layout). */
const FALLBACK_SIZE: Size = { width: 800, height: 480 }

type PanZoomState = { transform: Transform; animated: boolean }

/**
 * Pan (pointer drag), zoom (Ctrl or ⌘ + wheel, pinch with two pointers, buttons) and fit of a canvas. The transform is
 * one value that the viewer applies to a single group, so panning never re-renders the nodes. Fits on mount and when
 * the element is resized. `animated` is true for button-driven changes (so a CSS transition may play) and false while
 * the user drags or pinches.
 */
export function usePanZoom(bounds: Bounds) {
  const elementRef = useRef<HTMLDivElement | null>(null)
  // The canvas is only mounted in the map view, so effects follow the element instead of the component.
  const [element, setElement] = useState<HTMLDivElement | null>(null)
  const attach = useCallback((node: HTMLDivElement | null) => {
    elementRef.current = node
    setElement(node)
  }, [])
  const [state, setState] = useState<PanZoomState>({
    transform: IDENTITY,
    animated: false,
  })
  const [dragging, setDragging] = useState(false)
  const [size, setSize] = useState<Size>(FALLBACK_SIZE)

  const transformRef = useRef<Transform>(IDENTITY)
  const boundsRef = useRef(bounds)

  useEffect(() => {
    boundsRef.current = bounds
  }, [bounds])

  const readSize = useCallback((): Size => {
    const node = elementRef.current
    if (!node) return FALLBACK_SIZE
    const rect = node.getBoundingClientRect()
    const width = rect.width || node.clientWidth
    const height = rect.height || node.clientHeight
    return width > 0 && height > 0 ? { width, height } : FALLBACK_SIZE
  }, [])

  const commit = useCallback((transform: Transform, animated: boolean) => {
    transformRef.current = transform
    setState({ transform, animated })
  }, [])

  const fit = useCallback(
    (animated = true, box?: Bounds) => {
      const next = readSize()
      setSize(next)
      commit(fitTransform(box ?? boundsRef.current, next), animated)
    },
    [commit, readSize],
  )

  // Fit when the canvas appears, and again whenever it changes size.
  useLayoutEffect(() => {
    if (!element) return
    fit(false)
    if (typeof ResizeObserver === "undefined") return
    // The first callback only reports the size we have just fitted to.
    let first = true
    const observer = new ResizeObserver(() => {
      if (first) first = false
      else fit(false)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [element, fit])

  const zoomBy = useCallback(
    (factor: number, at?: { x: number; y: number }) => {
      const current = readSize()
      commit(zoomAt(transformRef.current, factor, at ?? { x: current.width / 2, y: current.height / 2 }), true)
    },
    [commit, readSize],
  )

  const zoomIn = useCallback(() => zoomBy(ZOOM_STEP), [zoomBy])
  const zoomOut = useCallback(() => zoomBy(1 / ZOOM_STEP), [zoomBy])

  /** Moves the map by a screen offset without animation (keeps a toggled node where the finger is). */
  const shiftBy = useCallback(
    (dx: number, dy: number) => {
      if (dx === 0 && dy === 0) return
      const current = transformRef.current
      commit({ ...current, x: current.x + dx, y: current.y + dy }, false)
    },
    [commit],
  )

  /** Pans (if needed) so that a world box is inside the canvas. */
  const reveal = useCallback(
    (box: Bounds) => {
      const next = panIntoView(transformRef.current, box, readSize())
      if (next !== transformRef.current) commit(next, true)
    },
    [commit, readSize],
  )

  const getTransform = useCallback(() => transformRef.current, [])
  const { wasDragged } = useCanvasGestures({
    element,
    getTransform,
    commit,
    setDragging,
  })

  return {
    /** Callback ref for the canvas element. */
    attach,
    element,
    transform: state.transform,
    animated: state.animated && !dragging,
    dragging,
    size,
    fit,
    zoomIn,
    zoomOut,
    shiftBy,
    reveal,
    wasDragged,
    getTransform,
  }
}
