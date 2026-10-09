"use client"

import { useLayoutEffect, useState, type RefObject } from "react"

/**
 * True when the element is measured narrower than `threshold` px. The viewer sits in a pane whose width does not
 * follow the screen (the middle pane of a three-pane workspace), so layouts that need room ask the pane. An element
 * that has no size yet (first render, tests) counts as wide.
 */
export function useNarrow(ref: RefObject<HTMLElement | null>, threshold: number): boolean {
  const [narrow, setNarrow] = useState(false)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element || typeof ResizeObserver === "undefined") return
    const update = () => {
      const width = element.getBoundingClientRect().width
      setNarrow(width > 0 && width < threshold)
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, threshold])

  return narrow
}
