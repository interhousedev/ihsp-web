"use client"

import { Label, RadioGroup, RadioGroupItem, THEME_CHOICES, isThemeChoice, useThemeChoice } from "@ihsp/ui"
import { useTr } from "../../shared/hooks/use-tr"

/** The three modes with a line of help each; the choice is applied at once and saved in the account. */
export function ThemeChoiceGroup() {
  const t = useTr()
  const { theme, setTheme } = useThemeChoice()

  return (
    <fieldset className="grid gap-2">
      <legend className="sr-only">{t("appearance.theme")}</legend>
      <RadioGroup
        value={theme}
        onValueChange={(value) => {
          if (isThemeChoice(value)) setTheme(value)
        }}
      >
        {THEME_CHOICES.map((mode) => (
          <div key={mode} className="flex min-h-11 items-start gap-3 py-1">
            <RadioGroupItem value={mode} id={`theme-${mode}`} className="mt-1" />
            <Label htmlFor={`theme-${mode}`} className="grid gap-0.5 font-normal">
              <span className="font-medium">{t(`appearance.${mode}`)}</span>
              <span className="text-muted-foreground text-xs">{t(`appearance.${mode}Hint`)}</span>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </fieldset>
  )
}
