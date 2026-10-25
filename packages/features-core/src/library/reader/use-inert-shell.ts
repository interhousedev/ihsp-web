"use client"

import { useEffect } from "react"

// The reader covers the whole window (`fixed inset-0`), but the app shell it sits in (sidebar, top bar, phone bottom bar,
// skip link) would still take keyboard focus behind it. While the reader is open those parts are made inert.
const SHELL = [
  "a[href='#main-content']",
  "[data-slot='sidebar-wrapper'] > [data-slot='sidebar']",
  "#main-content > header",
  "#main-content > nav",
].join(", ")

export function useInertShell(active: boolean): void {
  useEffect(() => {
    if (!active) return
    const parts = Array.from(document.querySelectorAll<HTMLElement>(SHELL)).filter((element) => !element.inert)
    for (const part of parts) part.inert = true
    return () => {
      for (const part of parts) part.inert = false
    }
  }, [active])
}
