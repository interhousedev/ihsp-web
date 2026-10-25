"use client"

import { getSession } from "@ihsp/auth"
import { ThemeChangeProvider, type ThemeChoice } from "@ihsp/ui"
import { useCallback, type ReactNode } from "react"
import { useUpdatePreferences } from "../notification-settings-form/use-update-preferences"
import { useAccountTheme } from "./use-account-theme"

/**
 * Keeps the light/dark mode in line with the account on every platform: `preferences.theme` is applied when the
 * session loads and when the window gets focus, and any change the user makes (`ThemeToggle`, the profile menu, the
 * settings pages) is saved with `PATCH /v1/id/me/preferences`. Mount it once in each app's providers, inside
 * `AppThemeProvider`, `AuthProvider` and the query client; it wraps the app so the controls can report their changes.
 */
export function ThemePreferenceSync({ children }: { children: ReactNode }) {
  const { mutate } = useUpdatePreferences()
  useAccountTheme()

  const save = useCallback(
    (theme: ThemeChoice) => {
      // Before login (the login screens) the choice only lives on this device.
      const session = getSession()
      if (!session || session.user.preferences.theme === theme) return
      mutate({ theme })
    },
    [mutate],
  )

  return <ThemeChangeProvider value={save}>{children}</ThemeChangeProvider>
}
