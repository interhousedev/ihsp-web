"use client"

import { useEffect, useRef } from "react"

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'

/** The focusable descendants of `root`, in DOM order. */
export function focusables(root: HTMLElement | null): HTMLElement[] {
  return root ? Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)) : []
}

/**
 * While `open`: Escape calls `onClose`, Tab and Shift+Tab cycle through `getFocusable()` and the page behind does not
 * scroll. The caller moves focus in on open and back on close.
 */
export function useModal({
  open,
  onClose,
  getFocusable,
}: {
  open: boolean
  onClose: () => void
  getFocusable: () => HTMLElement[]
}) {
  const latest = useRef({ onClose, getFocusable })
  latest.current = { onClose, getFocusable }
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        latest.current.onClose()
        return
      }
      if (event.key !== "Tab") return
      const items = latest.current.getFocusable()
      const first = items[0]
      const last = items[items.length - 1]
      if (!first || !last) return
      const active = document.activeElement as HTMLElement | null
      const inside = active ? items.includes(active) : false
      if (event.shiftKey && (!inside || active === first)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (!inside || active === last)) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = previous
    }
  }, [open])
}
