"use client"

import { useT } from "@ihsp/i18n"
import { Dropdown, Label } from "@ihsp/ui"
import { useId } from "react"
import { LANGUAGES, type LanguageChoice } from "./form-state"

export type LanguageFieldProps = {
  value: LanguageChoice
  onChange: (value: LanguageChoice) => void
}

/** "Language": Auto (the field is left out of the request) or Oʻzbekcha, Русский, English. */
export function LanguageField({ value, onChange }: LanguageFieldProps) {
  const t = useT("notebooks.opt")
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{t("language")}</Label>
      <Dropdown
        id={id}
        value={value}
        className="w-full"
        onValueChange={(next) => {
          const chosen = LANGUAGES.find((language) => language === next)
          if (chosen) onChange(chosen)
        }}
        options={LANGUAGES.map((language) => ({
          value: language,
          label: language === "auto" ? t("languageAuto") : t(`lang.${language}`),
        }))}
      />
    </div>
  )
}
