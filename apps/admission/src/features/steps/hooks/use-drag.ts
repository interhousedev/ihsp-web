import { useRef, type PointerEvent } from "react"
import type { TourPoint } from "../tour-state"

const THRESHOLD = 4

/**
 * Pointer dragging of a fixed box by a handle. A press that moves less than a few pixels stays a click; after a real
 * drag the next click is swallowed (`consumeDrag`) so a draggable button does not also fire its action.
 */
export function useDrag(getBox: () => HTMLElement | null, onMove: (point: TourPoint) => void) {
  const drag = useRef<{ dx: number; dy: number; sx: number; sy: number; moved: boolean } | null>(null)
  const dragged = useRef(false)
  return {
    consumeDrag(): boolean {
      const was = dragged.current
      dragged.current = false
      return was
    },
    handlers: {
      onPointerDown(event: PointerEvent<HTMLElement>) {
        const box = getBox()
        if (event.button !== 0 || !box) return
        const rect = box.getBoundingClientRect()
        drag.current = {
          dx: event.clientX - rect.left,
          dy: event.clientY - rect.top,
          sx: event.clientX,
          sy: event.clientY,
          moved: false,
        }
        dragged.current = false
        event.currentTarget.setPointerCapture?.(event.pointerId)
      },
      onPointerMove(event: PointerEvent<HTMLElement>) {
        const state = drag.current
        const box = getBox()
        if (!state || !box) return
        if (!state.moved && Math.hypot(event.clientX - state.sx, event.clientY - state.sy) < THRESHOLD) return
        state.moved = true
        dragged.current = true
        const x = Math.min(Math.max(event.clientX - state.dx, 0), window.innerWidth - box.offsetWidth)
        const y = Math.min(Math.max(event.clientY - state.dy, 0), window.innerHeight - box.offsetHeight)
        onMove({ x, y })
      },
      onPointerUp() {
        drag.current = null
      },
      onPointerCancel() {
        drag.current = null
      },
    },
  }
}
