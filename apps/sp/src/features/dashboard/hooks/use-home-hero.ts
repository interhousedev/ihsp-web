"use client"

import { useEffect, useState, useSyncExternalStore, type RefObject } from "react"

/**
 * Whether Home's hero (the big photo and name) is on screen. The shell reads it so the phone header does not show the
 * student's face twice: its avatar hides while the hero is visible and comes back once the hero scrolls away.
 */
let heroVisible = false
const listeners = new Set<() => void>()

function setHeroVisible(next: boolean) {
  if (heroVisible === next) return
  heroVisible = next
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** True while Home's hero is in the viewport (false on every other page). */
export function useHomeHeroVisible(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => heroVisible,
    () => false,
  )
}

/**
 * Watches the hero element. Returns whether it has left the viewport (the compact state), or `null` where
 * IntersectionObserver is missing, so the caller can fall back to the scroll position.
 */
export function useHomeHeroObserver(ref: RefObject<HTMLElement | null>): boolean | null {
  const [compact, setCompact] = useState<boolean | null>(null)
  useEffect(() => {
    const element = ref.current
    if (!element || typeof window === "undefined" || !("IntersectionObserver" in window)) return
    setHeroVisible(true)
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        setHeroVisible(entry.isIntersecting)
        setCompact(!entry.isIntersecting)
      },
      // The hero counts as gone once only a thin strip of it is left under the top of the screen.
      { rootMargin: "-56px 0px 0px 0px" },
    )
    observer.observe(element)
    return () => {
      observer.disconnect()
      setHeroVisible(false)
    }
  }, [ref])
  return compact
}
