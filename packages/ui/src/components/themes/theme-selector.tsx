"use client"

import { useT } from "@ihsp/i18n"

import { useThemeConfig } from "./active-theme"
import { Icons } from "../icons"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "../ui/select"
import { THEMES } from "./theme.config"

/** Color palette picker (the starter's themes); light/dark mode is `ThemeToggle`. */
export function ThemeSelector() {
  const t = useT()
  const { activeTheme, setActiveTheme } = useThemeConfig()

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="theme-selector" className="sr-only">
        {t("theme.palette")}
      </Label>
      <Select
        items={THEMES.map((theme) => ({ value: theme.value, label: theme.name }))}
        value={activeTheme}
        onValueChange={(value) => {
          if (value !== null) setActiveTheme(value)
        }}
      >
        <SelectTrigger id="theme-selector" className="justify-start rounded-full border-transparent bg-muted hover:bg-muted/70 *:data-[slot=select-value]:w-24">
          <span className="text-muted-foreground">
            <Icons.palette />
          </span>
          <SelectValue placeholder={t("theme.palette")} />
        </SelectTrigger>
        <SelectContent align="end">
          <SelectGroup>
            <SelectLabel>{t("theme.palette")}</SelectLabel>
            {THEMES.map((theme) => (
              <SelectItem key={theme.value} value={theme.value}>
                {theme.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
