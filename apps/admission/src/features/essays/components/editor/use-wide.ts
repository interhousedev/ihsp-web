"use client"

import { useSyncExternalStore } from "react"

function useMedia(query: string): boolean {
  const subscribe = (onChange: () => void) => {
    if (typeof window === "undefined" || !window.matchMedia) return () => undefined
    const media = window.matchMedia(query)
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }
  return useSyncExternalStore(
    subscribe,
    () => (typeof window === "undefined" || !window.matchMedia ? true : window.matchMedia(query).matches),
    () => true,
  )
}

/** Desktop width: the rail and the drawer sit beside the paper; below it they become sheets. Without matchMedia: true. */
export function useWide(): boolean {
  return useMedia("(min-width: 1024px)")
}

/** From a tablet up the editor panel sits beside the text (320 px at 768, wider on a desktop); below it a drawer. */
export function useSplit(): boolean {
  return useMedia("(min-width: 768px)")
}
