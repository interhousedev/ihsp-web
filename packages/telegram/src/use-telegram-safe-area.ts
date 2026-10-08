"use client"

import { useSignal, viewport } from "@tma.js/sdk-react"
import { useEffect } from "react"
import { isMiniApp } from "./is-mini-app"

type Insets = { top: number; bottom: number; left: number; right: number }

const SIDES = ["top", "right", "bottom", "left"] as const

/**
 * Inside Telegram: writes `--tg-safe-area-*` (device notches, Bot API 8.0) and `--tg-content-safe-area-*`
 * (Telegram's own header) in px on `<html>`. `@ihsp/ui` adds them to `env(safe-area-inset-*)` as `--safe-*`.
 * One source only: the SDK's own `bindCssVars` helpers are not used (docs/reference/telegram.md § 8.2).
 */
export function useTelegramSafeArea(): void {
  const safe = useSignal(viewport.safeAreaInsets) as Insets
  const content = useSignal(viewport.contentSafeAreaInsets) as Insets
  const active = isMiniApp()

  useEffect(() => {
    if (!active) return
    const root = document.documentElement
    for (const side of SIDES) {
      root.style.setProperty(`--tg-safe-area-${side}`, `${safe[side] ?? 0}px`)
      root.style.setProperty(`--tg-content-safe-area-${side}`, `${content[side] ?? 0}px`)
    }
    return () => {
      for (const side of SIDES) {
        root.style.removeProperty(`--tg-safe-area-${side}`)
        root.style.removeProperty(`--tg-content-safe-area-${side}`)
      }
    }
  }, [active, safe, content])
}
