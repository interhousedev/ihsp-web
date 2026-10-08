"use client"

import type { ReactNode } from "react"

import { Toaster } from "../ui/sonner"
import { ActiveThemeProvider } from "./active-theme"
import { ThemeProvider } from "./theme-provider"

/**
 * Light/dark mode (next-themes, class on <html>), the color palette (data-theme) and the toast area.
 * Both choices live in localStorage; nothing reads cookies, so the app stays a static export.
 */
export function AppThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange enableColorScheme>
      <ActiveThemeProvider>
        {children}
        <Toaster />
      </ActiveThemeProvider>
    </ThemeProvider>
  )
}
