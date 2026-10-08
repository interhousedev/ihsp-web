"use client"

import { useT } from "@ihsp/i18n"
import { useTheme } from "next-themes"
import { useCallback, type MouseEvent } from "react"
import { startThemeTransition } from "../lib/theme-transition"
import { Icons } from "./icons"
import { Button } from "./ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"

/** Light/dark switch (44 px touch target on phones). */
export function ThemeToggle() {
  const t = useT()
  const { setTheme, resolvedTheme } = useTheme()

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
