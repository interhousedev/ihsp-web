"use client"

import { useUpdatePreferences, usePreferences } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { LanguageSwitcher, ToggleGroup, ToggleGroupItem, useTheme } from "@ihsp/ui"

const THEMES = ["light", "dark", "system"] as const
type ThemeChoice = (typeof THEMES)[number]

function isTheme(value: unknown): value is ThemeChoice {
  return THEMES.includes(value as ThemeChoice)
}

/** Language and theme: applied at once and saved in the account (UF-WEB-17 step 1). */
export function GeneralSettings() {
  const t = useT("settings.general")
  const preferences = usePreferences()
  const update = useUpdatePreferences()
  const { theme, setTheme } = useTheme()
  const current: ThemeChoice = isTheme(theme) ? theme : (preferences?.theme ?? "system")

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-medium">{t("language")}</span>
        <LanguageSwitcher className="h-11 w-48 md:h-8" onChange={(locale) => update.mutate({ locale })} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span id="settings-theme" className="text-sm font-medium">
          {t("theme")}
        </span>
        <ToggleGroup
          value={[current]}
          variant="outline"
          aria-labelledby="settings-theme"
          onValueChange={(values) => {
            const next = values[0]
            if (!isTheme(next)) return
            setTheme(next)
            update.mutate({ theme: next })
          }}
        >
          {THEMES.map((value) => (
            <ToggleGroupItem key={value} value={value} className="min-h-11 px-3 md:min-h-8">
              {t(`themes.${value}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </div>
  )
}
