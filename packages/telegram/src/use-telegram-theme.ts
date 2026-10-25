"use client"

import { themeParams, useSignal } from "@tma.js/sdk-react"
import { useEffect } from "react"
import { isMiniApp } from "./is-mini-app"
import { themeParamsToCssVars, type TelegramThemeColors } from "./theme-vars"

/**
 * Inside Telegram: writes the user's theme to the design tokens on `<html>` and keeps the `dark` class in sync.
 * Outside Telegram it does nothing. Returns whether the Telegram theme is dark (`null` outside Telegram).
 */
export function useTelegramTheme(): boolean | null {
  const state = useSignal(themeParams.state) as TelegramThemeColors
  const isDark = useSignal(themeParams.isDark)
  const active = isMiniApp()

  useEffect(() => {
    if (!active) return
    const root = document.documentElement
    const vars = themeParamsToCssVars(state)
    for (const [name, value] of Object.entries(vars)) root.style.setProperty(name, value)
    root.classList.toggle("dark", isDark)
    root.style.colorScheme = isDark ? "dark" : "light"
    return () => {
      for (const name of Object.keys(vars)) root.style.removeProperty(name)
    }
  }, [active, state, isDark])

  return active ? isDark : null
}
