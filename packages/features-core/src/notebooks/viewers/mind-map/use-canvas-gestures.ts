"use client"

import { useCallback, useEffect, useRef } from "react"
import { clampScale, zoomAt, type Point, type Transform } from "./transform"

const DRAG_THRESHOLD = 4
const WHEEL_SPEED = 0.0025

type Gesture =
  | { kind: "none" }
  | { kind: "pan"; start: Point; origin: Transform; moved: boolean }
  | { kind: "pinch"; distance: number; centre: Point; origin: Transform }

type GestureArgs = {
  element: HTMLElement | null
  getTransform: () => Transform
  commit: (transform: Transform, animated: boolean) => void
  setDragging: (dragging: boolean) => void
}

function distanceBetween(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function middleOf(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

/**
 * Pointer gestures of the canvas, attached natively: drag to pan, two pointers to pinch, Ctrl/⌘ + wheel to zoom (that
 * is also what a trackpad pinch sends). A plain wheel is left alone so that the page scrolls. The wheel listener must
 * be native and non-passive to be able to stop the browser's own page zoom.
 */
export function useCanvasGestures({ element, getTransform, commit, setDragging }: GestureArgs) {
  const dragged = useRef(false)

  useEffect(() => {
    if (!element) return
    const target = element
    const pointers = new Map<number, Point>()
    let gesture: Gesture = { kind: "none" }

    function localPoint(event: MouseEvent): Point {
      const rect = target.getBoundingClientRect()
      return { x: event.clientX - rect.left, y: event.clientY - rect.top }
    }

    function startPinch() {
      const [first, second] = [...pointers.values()]
      if (!first || !second) return
      gesture = {
        kind: "pinch",
        distance: Math.max(1, distanceBetween(first, second)),
        centre: middleOf(first, second),
        origin: getTransform(),
      }
    }

    function onPointerDown(event: PointerEvent) {
      if (event.pointerType === "mouse" && event.button !== 0) return
      const point = localPoint(event)
      pointers.set(event.pointerId, point)
      if (pointers.size === 1) gesture = { kind: "pan", start: point, origin: getTransform(), moved: false }
      else if (pointers.size === 2) startPinch()
    }

    function onPointerMove(event: PointerEvent) {
      if (!pointers.has(event.pointerId)) return
      const point = localPoint(event)
      pointers.set(event.pointerId, point)

      if (gesture.kind === "pan") {
        const dx = point.x - gesture.start.x
        const dy = point.y - gesture.start.y
        if (!gesture.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
        if (!gesture.moved) {
          gesture.moved = true
          dragged.current = true
          setDragging(true)
          // Capture only once the gesture is a drag, so that a plain click still reaches the node under the finger.
          target.setPointerCapture?.(event.pointerId)
        }
        commit({ ...gesture.origin, x: gesture.origin.x + dx, y: gesture.origin.y + dy }, false)
      } else if (gesture.kind === "pinch") {
        const [first, second] = [...pointers.values()]
        if (!first || !second) return
        dragged.current = true
        const k = clampScale(gesture.origin.k * (distanceBetween(first, second) / gesture.distance))
        const centre = middleOf(first, second)
        const worldX = (gesture.centre.x - gesture.origin.x) / gesture.origin.k
        const worldY = (gesture.centre.y - gesture.origin.y) / gesture.origin.k
        commit({ x: centre.x - worldX * k, y: centre.y - worldY * k, k }, false)
      }
    }

    function onPointerEnd(event: PointerEvent) {
      if (!pointers.delete(event.pointerId)) return
      target.releasePointerCapture?.(event.pointerId)
      if (pointers.size === 0) {
        gesture = { kind: "none" }
        setDragging(false)
        if (dragged.current) {
          // The `click` that follows a drag must not open a node.
          setTimeout(() => {
            dragged.current = false
          }, 0)
        }
      } else if (pointers.size === 1) {
        // One finger of a pinch is still down: carry on as a pan from where the map is now.
        const [rest] = [...pointers.values()]
        gesture = rest ? { kind: "pan", start: rest, origin: getTransform(), moved: true } : { kind: "none" }
      }
    }

    function onWheel(event: WheelEvent) {
      if (!event.ctrlKey && !event.metaKey) return
      event.preventDefault()
      const speed = event.deltaMode === 1 ? 0.05 : WHEEL_SPEED
      const factor = Math.min(1.5, Math.max(1 / 1.5, Math.exp(-event.deltaY * speed)))
      commit(zoomAt(getTransform(), factor, localPoint(event)), false)
    }

    target.addEventListener("pointerdown", onPointerDown)
    target.addEventListener("pointermove", onPointerMove)
    target.addEventListener("pointerup", onPointerEnd)
    target.addEventListener("pointercancel", onPointerEnd)
    target.addEventListener("wheel", onWheel, { passive: false })
    return () => {
      target.removeEventListener("pointerdown", onPointerDown)
      target.removeEventListener("pointermove", onPointerMove)
      target.removeEventListener("pointerup", onPointerEnd)
      target.removeEventListener("pointercancel", onPointerEnd)
      target.removeEventListener("wheel", onWheel)
    }
  }, [element, getTransform, commit, setDragging])

  /** True right after a drag or a pinch: the click that ends it should be ignored. */
  const wasDragged = useCallback(() => dragged.current, [])
  return { wasDragged }
}
