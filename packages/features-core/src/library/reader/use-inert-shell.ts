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
// The floating nav panel of the shell sits in the top end corner, where the reader's own buttons are: it is hidden too
// (the reader has its own back button), so the two never overlap at any width.
const CONTROLS = "[data-slot='shell-controls']"

export function useInertShell(active: boolean): void {
  useEffect(() => {
    if (!active) return
    const parts = Array.from(document.querySelectorAll<HTMLElement>(SHELL)).filter((element) => !element.inert)
    for (const part of parts) part.inert = true
    const controls = Array.from(document.querySelectorAll<HTMLElement>(CONTROLS))
    for (const element of controls) {
      element.inert = true
      element.style.visibility = "hidden"
    }
    return () => {
      for (const part of parts) part.inert = false
      for (const element of controls) {
        element.inert = false
        element.style.visibility = ""
      }
    }
  }, [active])
}
