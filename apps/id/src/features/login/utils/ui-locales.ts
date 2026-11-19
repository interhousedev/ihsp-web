import type { Locale } from "@ihsp/i18n"

const SUPPORTED: readonly Locale[] = ["uz", "ru", "en"]

/** The first supported language of an OIDC `ui_locales` value (`"ru en"`, `"ru-RU,en"`), or `null`. */
export function localeOfUiLocales(value: string | null | undefined): Locale | null {
  if (!value) return null
  for (const tag of value.split(/[\s,]+/)) {
    const base = tag.toLowerCase().split(/[-_]/)[0]
    const found = SUPPORTED.find((locale) => locale === base)
    if (found) return found
  }
  return null
}
