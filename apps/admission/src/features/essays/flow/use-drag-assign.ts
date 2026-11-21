"use client"

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"

const THRESHOLD = 6
const DROP_ATTR = "data-drop-slot"

export type DragState = { essayId: string; title: string; x: number; y: number }

/**
 * Pointer-driven drag and drop of an essay onto a slot. Only a mouse or pen drags; a finger scrolls and taps, and the
 * tap and the keyboard use the chip's own button, so every drop has a drag-free equivalent. A slot is a drop target
 * when it carries `data-drop-slot="<slot>"` and `accepts` allows the essay.
 */
export function useDragAssign({
  accepts,
  onDrop,
}: {
  accepts: (slot: string, essayId: string) => boolean
  onDrop: (slot: string, essayId: string) => void
}) {
  const [drag, setDrag] = useState<DragState | null>(null)
  const [over, setOver] = useState<string | null>(null)
  const justDragged = useRef(false)
  const cleanup = useRef<(() => void) | null>(null)
  const latest = useRef({ accepts, onDrop })
  latest.current = { accepts, onDrop }

  useEffect(() => () => cleanup.current?.(), [])

  const slotAt = useCallback((x: number, y: number, essayId: string) => {
    const slot = document.elementFromPoint(x, y)?.closest(`[${DROP_ATTR}]`)?.getAttribute(DROP_ATTR) ?? null
    return slot && latest.current.accepts(slot, essayId) ? slot : null
  }, [])

  const start = useCallback(
    (essayId: string, title: string) => (event: ReactPointerEvent) => {
      if (event.button !== 0 || event.pointerType === "touch") return
      const origin = { x: event.clientX, y: event.clientY }
      let active = false
      const move = (e: PointerEvent) => {
        if (!active && Math.hypot(e.clientX - origin.x, e.clientY - origin.y) < THRESHOLD) return
        active = true
        document.body.style.userSelect = "none"
        setDrag({ essayId, title, x: e.clientX, y: e.clientY })
        setOver(slotAt(e.clientX, e.clientY, essayId))
      }
      const stop = () => {
        window.removeEventListener("pointermove", move)
        window.removeEventListener("pointerup", up)
        window.removeEventListener("pointercancel", stop)
        window.removeEventListener("keydown", key)
        document.body.style.userSelect = ""
        cleanup.current = null
        setDrag(null)
        setOver(null)
      }
      const up = (e: PointerEvent) => {
        if (active) {
          justDragged.current = true
          setTimeout(() => (justDragged.current = false), 0)
          const slot = slotAt(e.clientX, e.clientY, essayId)
          if (slot) latest.current.onDrop(slot, essayId)
        }
        stop()
      }
      const key = (e: KeyboardEvent) => {
        if (e.key === "Escape") stop()
      }
      cleanup.current?.()
      cleanup.current = stop
      window.addEventListener("pointermove", move)
      window.addEventListener("pointerup", up)
      window.addEventListener("pointercancel", stop)
      window.addEventListener("keydown", key)
    },
    [slotAt],
  )

  /** True once right after a drag ended, so the click the browser sends after pointerup is ignored. */
  const consumeClick = useCallback(() => justDragged.current, [])

  return { drag, over, start, consumeClick, DROP_ATTR }
}
