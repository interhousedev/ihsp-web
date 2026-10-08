"use client"

import { useT } from "@ihsp/i18n"
import { useSyncExternalStore } from "react"
import { Icons } from "./icons"
import { Badge } from "./ui/badge"

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange)
  window.addEventListener("offline", onChange)
  return () => {
    window.removeEventListener("online", onChange)
    window.removeEventListener("offline", onChange)
  }
}

/** `navigator.onLine` as a hook; always `true` while prerendering. */
export function useOnline(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  )
}

/** "Offline" badge for the top bar. Shown when the browser is offline or when `forceVisible` (last fetch failed). */
export function OfflineBadge({ forceVisible = false }: { forceVisible?: boolean }) {
  const t = useT()
  const online = useOnline()
  if (online && !forceVisible) return null
  return (
    <Badge variant="secondary" role="status" className="gap-1">
      <Icons.offline className="size-3.5" aria-hidden />
      {t("common.offline")}
    </Badge>
  )
}
