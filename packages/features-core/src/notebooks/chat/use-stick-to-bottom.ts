"use client"

import { useCallback, useLayoutEffect, useRef, useState } from "react"

const NEAR_BOTTOM_PX = 80

/**
 * Keeps a scrolling conversation at its end while the student is at the end (new messages and the growing answer
 * scroll into view) and leaves it alone once they scrolled up; `atBottom` drives a "scroll to latest" button.
 */
export function useStickToBottom() {
  const ref = useRef<HTMLDivElement>(null)
  const stuck = useRef(true)
  const [atBottom, setAtBottom] = useState(true)

  const onScroll = useCallback(() => {
    const element = ref.current
    if (!element) return
    const near = element.scrollHeight - element.scrollTop - element.clientHeight < NEAR_BOTTOM_PX
    stuck.current = near
    setAtBottom(near)
  }, [])

  // After every render of the conversation: new messages and the growing answer change its height.
  useLayoutEffect(() => {
    const element = ref.current
    if (element && stuck.current) element.scrollTop = element.scrollHeight
  })

  const scrollToEnd = useCallback(() => {
    const element = ref.current
    if (!element) return
    stuck.current = true
    setAtBottom(true)
    const reduced =
      typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    element.scrollTo?.({ top: element.scrollHeight, behavior: reduced ? "auto" : "smooth" })
  }, [])

  return { ref, onScroll, atBottom, scrollToEnd }
}
