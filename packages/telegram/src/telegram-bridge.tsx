"use client"

import { useEffect, type ReactNode } from "react"
import { initTelegram } from "./init-telegram"
import { useTelegramSafeArea } from "./use-telegram-safe-area"
import { useTelegramTheme } from "./use-telegram-theme"

/** Place once near the root of `sp`, `staff` and `id`: initialises the SDK and maps theme and safe areas. */
export function TelegramBridge({ children }: { children: ReactNode }) {
  useEffect(() => {
    initTelegram().catch((error: unknown) => console.error("[telegram] init failed", error))
  }, [])
  useTelegramTheme()
  useTelegramSafeArea()
  return <>{children}</>
}
