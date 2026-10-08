"use client"

import { useT } from "@ihsp/i18n"
import { useCallback, type MouseEvent } from "react"
import { startThemeTransition } from "../lib/theme-transition"
import { Icons } from "./icons"
import { useThemeChoice } from "./themes/theme-choice"
import { Button } from "./ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"

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

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="secondary"
            size="icon"
            className="size-11 md:size-8"
            onClick={toggle}
            aria-label={t("theme.toggle")}
          />
        }
      >
        <Icons.brightness />
      </TooltipTrigger>
      <TooltipContent>{t("theme.toggle")}</TooltipContent>
    </Tooltip>
  )
}
