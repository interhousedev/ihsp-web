"use client"

import { useT } from "@ihsp/i18n"
import { useCallback, type MouseEvent } from "react"
import { startThemeTransition } from "../lib/theme-transition"
import { Icons } from "./icons"
import { useThemeChoice } from "./themes/theme-choice"
import { IconButton } from "./ui/icon-button"

/** Light/dark switch (44 px touch target on phones). The choice is saved in the account when one is logged in. */
export function ThemeToggle() {
  const t = useT()
  const { setTheme, resolvedTheme } = useThemeChoice()

  const toggle = useCallback(
    (event: MouseEvent) => {
      const next = resolvedTheme === "dark" ? "light" : "dark"
      startThemeTransition(() => setTheme(next), event)
    },
    [resolvedTheme, setTheme],
  )

  return <IconButton icon={Icons.brightness} onClick={toggle} aria-label={t("theme.toggle")} />
}
