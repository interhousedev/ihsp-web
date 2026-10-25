"use client"

import { type ReactNode, createContext, useCallback, useContext, useEffect, useState } from "react"

import { DEFAULT_THEME, THEMES } from "./theme.config"

/** The chosen color palette is a per-device convenience, so it lives in localStorage (the app is static). */
export const COLOR_THEME_STORAGE_KEY = "ihsp.color-theme"

type ThemeContextType = {
  activeTheme: string
  setActiveTheme: (theme: string) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

function readStoredTheme(): string | null {
  try {
    const stored = window.localStorage.getItem(COLOR_THEME_STORAGE_KEY)
    return THEMES.some((theme) => theme.value === stored) ? stored : null
  } catch {
    return null
  }
}

export function ActiveThemeProvider({ children, initialTheme }: { children: ReactNode; initialTheme?: string }) {
  const [activeTheme, setActiveThemeState] = useState<string>(initialTheme ?? DEFAULT_THEME)

  // The inline script in each app's layout already set data-theme before paint; this syncs React state with it.
  useEffect(() => {
    const stored = readStoredTheme()
    if (stored) setActiveThemeState(stored)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", activeTheme)
  }, [activeTheme])

  const setActiveTheme = useCallback((theme: string) => {
    setActiveThemeState(theme)
    try {
      window.localStorage.setItem(COLOR_THEME_STORAGE_KEY, theme)
    } catch {
      // Storage can be blocked (private mode); the choice then lasts until the page closes.
    }
  }, [])

  return <ThemeContext.Provider value={{ activeTheme, setActiveTheme }}>{children}</ThemeContext.Provider>
}

export function useThemeConfig() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useThemeConfig must be used within an ActiveThemeProvider")
  }
  return context
}
