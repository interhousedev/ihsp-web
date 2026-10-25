"use client"

import { useEffect } from "react"

/**
 * Asks before the page is left with unsaved changes: the browser's own prompt for closing the tab or reloading
 * (`beforeunload`), and a confirm for clicks on links inside the app (the app is a static export, so a link click is
 * a client-side navigation that `beforeunload` never sees).
 */
export function useLeaveGuard(active: boolean, message: string): void {
  useEffect(() => {
    if (!active) return

    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault()
      event.returnValue = ""
    }

    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return
      const anchor = (event.target as Element | null)?.closest?.("a[href]")
      if (!anchor) return
      const target = anchor.getAttribute("target")
      if (target && target !== "_self") return
      const href = anchor.getAttribute("href") ?? ""
      if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return
      if (!window.confirm(message)) {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    window.addEventListener("beforeunload", onBeforeUnload)
    document.addEventListener("click", onClick, true)
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload)
      document.removeEventListener("click", onClick, true)
    }
  }, [active, message])
}
