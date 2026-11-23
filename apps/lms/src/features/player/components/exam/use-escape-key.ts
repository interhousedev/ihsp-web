import { useEffect, useRef } from "react"

/** Calls `onEscape` when Escape is pressed anywhere while `active` holds (dialogs of the exam player). */
export function useEscapeKey(onEscape: () => void, active = true) {
  const latest = useRef(onEscape)
  useEffect(() => {
    latest.current = onEscape
  }, [onEscape])
  useEffect(() => {
    if (!active) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") latest.current()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [active])
}
