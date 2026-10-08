"use client"

import { useSession } from "@ihsp/auth"
import { useTheme } from "@ihsp/ui"
import { useEffect } from "react"

const THEME_STORAGE_KEY = "theme"

function hasStoredTheme(): boolean {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) !== null
  } catch {
    return true
  }
}

/** A device that has no theme of its own yet takes the one saved in the account (Settings). */
export function ThemeSync() {
  const { session } = useSession()
  const { setTheme } = useTheme()
  const accountTheme = session?.user.preferences.theme
  const userId = session?.user.id

  useEffect(() => {
    if (!userId || !accountTheme || hasStoredTheme()) return
    setTheme(accountTheme)
  }, [userId, accountTheme, setTheme])

  return null
}
