"use client"

import { useCallback, useEffect, useRef } from "react"
import type { Point, Transform } from "./transform"

const DRAG_THRESHOLD = 4

type DragArgs = {
  element: HTMLElement | null
  getTransform: () => Transform
  /** Where (world coordinates) the pill or block with this id is now. */
  positionOf: (id: string) => Point | undefined
  onMove: (id: string, at: Point) => void
}

type Drag = {
  id: string
  start: Point
  origin: Point
  pointerId: number
  moved: boolean
}

/**
 * Drags pills and text blocks (`data-node-id`, `data-block-id`) anywhere on the canvas, with a mouse, a pen or a finger.
 * The canvas gestures leave such a pointer alone, so the map does not pan while a pill is dragged. The toggle control
 * on the right of a pill is not a handle. After a drag, `wasDragged` is true for a tick so that the click which ends it
 * does not open the node.
 */
export function useNodeDrag({ element, getTransform, positionOf, onMove }: DragArgs) {
  const dragged = useRef(false)
  const positionRef = useRef(positionOf)
  const moveRef = useRef(onMove)
  useEffect(() => {
    positionRef.current = positionOf
    moveRef.current = onMove
  })

  useEffect(() => {
    if (!element) return
    const target = element
    let drag: Drag | null = null

    function onPointerDown(event: PointerEvent) {
      if (drag || (event.pointerType === "mouse" && event.button !== 0)) return
      if (!(event.target instanceof Element)) return
      if (event.target.closest('[data-slot="mind-map-toggle"]')) return
      const holder = event.target.closest<SVGElement>("[data-node-id], [data-block-id]")
      const id = holder?.dataset.nodeId ?? holder?.dataset.blockId
      if (!id) return
      const origin = positionRef.current(id)
      if (!origin) return
      drag = {
        id,
        start: { x: event.clientX, y: event.clientY },
        origin,
        pointerId: event.pointerId,
        moved: false,
      }
    }

    function onPointerMove(event: PointerEvent) {
      if (!drag || event.pointerId !== drag.pointerId) return
      const dx = event.clientX - drag.start.x
      const dy = event.clientY - drag.start.y
      if (!drag.moved) {
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return
        drag.moved = true
        dragged.current = true
        target.setPointerCapture?.(event.pointerId)
      }
      const { k } = getTransform()
      moveRef.current(drag.id, {
        x: drag.origin.x + dx / k,
        y: drag.origin.y + dy / k,
      })
    }

    function onPointerEnd(event: PointerEvent) {
      if (!drag || event.pointerId !== drag.pointerId) return
      const wasMoved = drag.moved
      drag = null
      target.releasePointerCapture?.(event.pointerId)
      if (wasMoved) {
        setTimeout(() => {
          dragged.current = false
        }, 0)
      }
    }

    target.addEventListener("pointerdown", onPointerDown)
    target.addEventListener("pointermove", onPointerMove)
    target.addEventListener("pointerup", onPointerEnd)
    target.addEventListener("pointercancel", onPointerEnd)
    return () => {
      target.removeEventListener("pointerdown", onPointerDown)
      target.removeEventListener("pointermove", onPointerMove)
      target.removeEventListener("pointerup", onPointerEnd)
      target.removeEventListener("pointercancel", onPointerEnd)
    }
  }, [element, getTransform])

  const wasDragged = useCallback(() => dragged.current, [])
  return { wasDragged }
}
