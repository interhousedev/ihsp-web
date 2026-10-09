"use client"

import { useT } from "@ihsp/i18n"
import { Label, NativeSelect, NativeSelectOption } from "@ihsp/ui"
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
      <NativeSelect
        id={id}
        value={value}
        className="[&_select]:h-11 w-full md:[&_select]:h-8"
        onChange={(event) => {
          const chosen = LANGUAGES.find((language) => language === event.target.value)
          if (chosen) onChange(chosen)
        }}
      >
        {LANGUAGES.map((language) => (
          <NativeSelectOption key={language} value={language}>
            {language === "auto" ? t("languageAuto") : t(`lang.${language}`)}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  )
}
