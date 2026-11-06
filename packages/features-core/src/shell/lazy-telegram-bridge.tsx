"use client"

import { isMiniApp } from "@ihsp/telegram/core"
import { useEffect, useState, type ComponentType, type ReactNode } from "react"

type Bridge = ComponentType<{ children: ReactNode }>

/**
 * Theme, safe areas and the back button for apps reached from the mini app. The SDK chunk is imported only inside
 * Telegram; until it arrives, and everywhere else, the children render unchanged.
 */
export function LazyTelegramBridge({ children }: { children: ReactNode }) {
  const [Loaded, setLoaded] = useState<Bridge | null>(null)
  useEffect(() => {
    if (!isMiniApp()) return
    let cancelled = false
    import("@ihsp/telegram")
      .then((telegram) => {
        if (!cancelled) setLoaded(() => telegram.TelegramBridge)
      })
      .catch((error: unknown) => console.error("[telegram] bridge failed to load", error))
    return () => {
      cancelled = true
    }
  }, [])
  return Loaded ? <Loaded>{children}</Loaded> : <>{children}</>
}
