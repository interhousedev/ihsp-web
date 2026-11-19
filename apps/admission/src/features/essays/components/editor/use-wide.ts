"use client"

import { useSyncExternalStore } from "react"

const QUERY = "(min-width: 1024px)"

function subscribe(onChange: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => undefined
  const media = window.matchMedia(QUERY)
  media.addEventListener("change", onChange)
  return () => media.removeEventListener("change", onChange)
}

/** Desktop width: the rail and the drawer sit beside the paper; below it they become sheets. Without matchMedia: true. */
export function useWide(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => (typeof window === "undefined" || !window.matchMedia ? true : window.matchMedia(QUERY).matches),
    () => true,
  )
}
