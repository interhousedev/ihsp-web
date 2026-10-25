"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/** Closer than this to the end of the list counts as "at the bottom". */
const BOTTOM_TOLERANCE_PX = 80

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

/**
 * Keeps a scrolling message list at its end while the student reads the latest message. `follow` changes whenever
 * the content grows; a scroll up stops the following and shows the scroll-to-latest button (`atBottom` is false).
 */
export function useStickToBottom(follow: unknown) {
  const containerRef = useRef<HTMLDivElement>(null)
  const atBottomRef = useRef(true)
  const [atBottom, setAtBottom] = useState(true)

  const scrollToBottom = useCallback((smooth = false) => {
    const node = containerRef.current
    if (!node) return
    const behavior: ScrollBehavior = smooth && !prefersReducedMotion() ? "smooth" : "auto"
    if (typeof node.scrollTo === "function") node.scrollTo({ top: node.scrollHeight, behavior })
    else node.scrollTop = node.scrollHeight
    atBottomRef.current = true
    setAtBottom(true)
  }, [])

  const onScroll = useCallback(() => {
    const node = containerRef.current
    if (!node) return
    const distance = node.scrollHeight - node.scrollTop - node.clientHeight
    const near = distance <= BOTTOM_TOLERANCE_PX
    atBottomRef.current = near
    setAtBottom(near)
  }, [])

  useEffect(() => {
    if (atBottomRef.current) scrollToBottom()
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- `follow` only says that the content grew
  }, [follow, scrollToBottom])

  return { containerRef, atBottom, onScroll, scrollToBottom }
}
