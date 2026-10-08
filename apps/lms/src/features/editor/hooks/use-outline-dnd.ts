"use client"

import {
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import type { OutlineOp, OutlineSection } from "@ihsp/api"
import { useCallback } from "react"
import { computeDragOps, parseDragId } from "../utils/outline-ops"

/**
 * Drag and drop of the outline: sensors (pointer with a small distance so clicks still work, keyboard), collision
 * detection that only considers drop targets of the right kind, and the finished drag as outline operations.
 */
export function useOutlineDnd(outline: readonly OutlineSection[], onOps: (ops: OutlineOp[]) => void) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // Sections drag over sections; steps drag over steps and the ends of section lists.
  const collisionDetection = useCallback<CollisionDetection>((args) => {
    const dragging = parseDragId(args.active.id)?.kind
    const droppableContainers = args.droppableContainers.filter((container) => {
      const target = parseDragId(container.id)
      if (!target) return false
      return dragging === "section" ? target.kind === "section" : target.kind !== "section"
    })
    return closestCenter({ ...args, droppableContainers })
  }, [])

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const ops = computeDragOps(outline, event.active.id, event.over?.id)
      if (ops.length > 0) onOps(ops)
    },
    [onOps, outline],
  )

  return { sensors, collisionDetection, onDragEnd }
}
