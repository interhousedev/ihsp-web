"use client"

import { useT } from "@ihsp/i18n"
import { Input, Label, Textarea } from "@ihsp/ui"
import { useId } from "react"

export type Localized = { uz: string; ru: string; en: string }
export const LANGUAGES = ["uz", "ru", "en"] as const
export const emptyLocalized = (): Localized => ({ uz: "", ru: "", en: "" })

/** A name or text in the user's language with the fallbacks used everywhere in the library: locale, then en, ru, uz. */
export function pickLocalized(value: Localized | null | undefined, locale: string): string {
  if (!value) return ""
  const own = (value as Record<string, string>)[locale]
  return own?.trim() || value.en?.trim() || value.ru?.trim() || value.uz?.trim() || ""
}

/**
 * The same field in Uzbek, Russian and English (every library name is kept in all three). Each input is labelled
 * "<label> (Uzbek)" and so on; `errors` marks the languages that are empty.
 */
export function LocalizedFields({
  label,
  values,
  required = false,
  multiline = false,
  showErrors = false,
  onChange,
}: {
  label: string
  values: Localized
  required?: boolean
  multiline?: boolean
  /** Show "required" under the empty inputs (after a submit attempt). */
  showErrors?: boolean
  onChange: (values: Localized) => void
}) {
  const lang = useT("library.manage.lang")
  const t = useT("library.manage")
  const id = useId()
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 text-sm font-medium">
        {label}
        {required ? <span aria-hidden> *</span> : null}
      </legend>
      {LANGUAGES.map((code) => {
        const empty = required && values[code].trim() === ""
        const invalid = showErrors && empty
        const name = `${label} (${lang(code)})`
        return (
          <div key={code} className="flex flex-col gap-1">
            <Label htmlFor={`${id}-${code}`} className="text-muted-foreground text-xs font-normal">
              {lang(code)}
            </Label>
            {multiline ? (
              <Textarea
                id={`${id}-${code}`}
                rows={2}
                aria-label={name}
                aria-invalid={invalid}
                value={values[code]}
                onChange={(event) => onChange({ ...values, [code]: event.target.value })}
              />
            ) : (
              <Input
                id={`${id}-${code}`}
                aria-label={name}
                aria-invalid={invalid}
                aria-required={required}
                value={values[code]}
                className="min-h-11 md:min-h-8"
                onChange={(event) => onChange({ ...values, [code]: event.target.value })}
              />
            )}
            {invalid ? (
              <p role="alert" className="text-destructive text-xs">
                {t("fieldRequired")}
              </p>
            ) : null}
          </div>
        )
      })}
    </fieldset>
  )
}
