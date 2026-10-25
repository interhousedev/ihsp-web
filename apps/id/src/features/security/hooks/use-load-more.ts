"use client"

import { useEffect, useRef } from "react"

/** Calls `onMore` when the returned element scrolls into view (infinite scroll); the button stays as the fallback. */
export function useLoadMore(onMore: () => void, enabled: boolean) {
  const ref = useRef<HTMLDivElement | null>(null)
  const callback = useRef(onMore)

  useEffect(() => {
    callback.current = onMore
  })

  useEffect(() => {
    const element = ref.current
    if (!enabled || !element || typeof IntersectionObserver === "undefined") return
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) callback.current()
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [enabled])

  return ref
}
