"use client"

import { useT } from "@ihsp/i18n"
import { useEffect } from "react"

function isInAppNavigation(event: MouseEvent, anchor: HTMLAnchorElement): boolean {
  if (event.defaultPrevented || event.button !== 0) return false
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false
  if (anchor.target && anchor.target !== "_self") return false
  if (anchor.hasAttribute("download")) return false
  if ((anchor.getAttribute("href") ?? "").startsWith("#")) return false
  return new URL(anchor.href, window.location.href).origin === window.location.origin
}

/** While `active`, closing the tab and following an in-app link both ask first; a refusal keeps the page. */
export function useUnsavedGuard(active: boolean) {
  const t = useT()
  const message = t("common.saveBar.leaveConfirm")

  useEffect(() => {
    if (!active) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault()
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest?.("a[href]")
      if (!(anchor instanceof HTMLAnchorElement) || !isInAppNavigation(event, anchor)) return
      if (window.confirm(message)) return
      event.preventDefault()
      event.stopImmediatePropagation()
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    document.addEventListener("click", onClick, true)
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload)
      document.removeEventListener("click", onClick, true)
    }
  }, [active, message])
}
