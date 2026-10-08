"use client"

import { useUpdatePreferences } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import {
  LanguageSwitcher,
  THEME_CHOICES,
  ToggleGroup,
  ToggleGroupItem,
  isThemeChoice,
  useThemeChoice,
} from "@ihsp/ui"

/** Language and theme: applied at once and saved in the account. */
export function GeneralSettings() {
  const t = useT("settings.general")
  const update = useUpdatePreferences()
  const { theme, setTheme } = useThemeChoice()

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
          value={[theme]}
          variant="outline"
          aria-labelledby="settings-theme"
          onValueChange={(values) => {
            const next = values[0]
            if (isThemeChoice(next)) setTheme(next)
          }}
        >
          {THEME_CHOICES.map((value) => (
            <ToggleGroupItem key={value} value={value} className="min-h-11 px-3 md:min-h-8">
              {t(`themes.${value}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </div>
  )
}
