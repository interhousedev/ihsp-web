"use client"

import { useTheme } from "next-themes"
import { createContext, useCallback, useContext } from "react"

/** The light/dark preference an account stores (`preferences.theme`). */
export type ThemeChoice = "light" | "dark" | "system"

export const THEME_CHOICES: readonly ThemeChoice[] = ["light", "dark", "system"]

/** The default of the first visit, before the account says otherwise. */
export const DEFAULT_THEME_CHOICE: ThemeChoice = "light"

export function isThemeChoice(value: unknown): value is ThemeChoice {
  return THEME_CHOICES.includes(value as ThemeChoice)
}

const ThemeChangeContext = createContext<(theme: ThemeChoice) => void>(() => undefined)

/**
 * Provided by the account sync (`ThemePreferenceSync` in `@ihsp/features-core`): called after every change the user
 * makes, so the choice is saved in the account. Without a provider (login screens, public pages) a change stays local.
 */
export const ThemeChangeProvider = ThemeChangeContext.Provider

/**
 * Light/dark mode for the controls (`ThemeToggle`, the profile menu, the settings pages): the change is applied at
 * once and reported to the account sync. Read-only consumers can keep using `useTheme`.
 */
export function useThemeChoice(): {
  theme: ThemeChoice
  resolvedTheme: "light" | "dark"
  setTheme: (theme: ThemeChoice) => void
} {
  const { theme, resolvedTheme, setTheme: applyTheme } = useTheme()
  const onChange = useContext(ThemeChangeContext)

  const setTheme = useCallback(
    (next: ThemeChoice) => {
      applyTheme(next)
      onChange(next)
    },
    [applyTheme, onChange],
  )

  return {
    theme: isThemeChoice(theme) ? theme : DEFAULT_THEME_CHOICE,
    resolvedTheme: resolvedTheme === "dark" ? "dark" : "light",
    setTheme,
  }
}
