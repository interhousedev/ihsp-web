"use client"

import type { ReactNode } from "react"

import { Toaster } from "../ui/sonner"
import { ActiveThemeProvider } from "./active-theme"
import { ThemeProvider } from "./theme-provider"
import { DEFAULT_THEME_CHOICE } from "./theme-choice"

/**
 * Light/dark mode (next-themes, class on <html>), the color palette (data-theme) and the toast area.
 * Both choices live in localStorage; nothing reads cookies, so the app stays a static export. The mode is light until
 * the account says otherwise (`ThemePreferenceSync` keeps localStorage in line with `preferences.theme`).
 */
export function AppThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={DEFAULT_THEME_CHOICE}
      enableSystem
      disableTransitionOnChange
      enableColorScheme
    >
      <ActiveThemeProvider>
        {children}
        <Toaster />
      </ActiveThemeProvider>
    </ThemeProvider>
  )
}
