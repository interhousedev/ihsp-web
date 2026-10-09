"use client"

import { useEffect, useState } from "react"

const KEY = "ihsp:library:layout"
export type CardLayout = "grid" | "list"

/** Grid or list for result cards, remembered on this device (storage can be blocked: then it is just not remembered). */
export function useLayoutPreference(): [CardLayout, (layout: CardLayout) => void] {
  const [layout, setLayout] = useState<CardLayout>("grid")
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(KEY)
      if (saved === "grid" || saved === "list") setLayout(saved)
    } catch {
      // storage unavailable: keep the default
    }
  }, [])
  return [
    layout,
    (next) => {
      setLayout(next)
      try {
        window.localStorage.setItem(KEY, next)
      } catch {
        // not remembered
      }
    },
  ]
}
