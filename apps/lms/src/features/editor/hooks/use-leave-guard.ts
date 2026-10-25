"use client"

import { useEffect, useRef } from "react"

/** Whether a click on an anchor is a plain in-app navigation (not a new tab, download or another site). */
function isInAppNavigation(event: MouseEvent, anchor: HTMLAnchorElement): boolean {
  if (event.defaultPrevented || event.button !== 0) return false
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false
  if (anchor.target && anchor.target !== "_self") return false
  if (anchor.hasAttribute("download")) return false
  const href = anchor.getAttribute("href") ?? ""
  if (href.startsWith("#")) return false
  return new URL(anchor.href, window.location.href).origin === window.location.origin
}

/**
 * Guards in-app navigation (the course tools, the bottom nav, links in the outline) the way `beforeunload` guards the
 * tab: every in-app link click first runs `flush` (saves what is pending), and while `confirmWhen` (the edits could not
 * be saved: offline, an error, a conflict) the user is asked with `message` before the page is left. A refusal keeps
 * the page; the edits stay in the browser buffer either way.
 */
export function useLeaveGuard({
  flush,
  confirmWhen,
  message,
}: {
  flush: () => void
  confirmWhen: boolean
  message: string
}) {
  const latest = useRef({ flush, confirmWhen, message })
  useEffect(() => {
    latest.current = { flush, confirmWhen, message }
  })

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest?.("a[href]")
      if (!(anchor instanceof HTMLAnchorElement) || !isInAppNavigation(event, anchor)) return
      const { flush, confirmWhen, message } = latest.current
      if (confirmWhen && !window.confirm(message)) {
        event.preventDefault()
        event.stopImmediatePropagation()
        return
      }
      flush()
    }
    document.addEventListener("click", onClick, true)
    return () => document.removeEventListener("click", onClick, true)
  }, [])
}
