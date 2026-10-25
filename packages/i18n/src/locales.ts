export const LOCALES = ["uz", "ru", "en"] as const

export type Locale = (typeof LOCALES)[number]

/** Used when neither the account, the browser storage nor the browser language gives a supported locale. */
export const DEFAULT_LOCALE: Locale = "ru"

export const LOCALE_STORAGE_KEY = "ihsp.locale"

/** Names of the languages in their own language (shown in the language switcher). */
export const LOCALE_NAMES: Record<Locale, string> = {
  uz: "Oʻzbekcha",
  ru: "Русский",
  en: "English",
}

export const TIME_ZONE = "Asia/Tashkent"

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value)
}

/** `ru-RU` → `ru`; unsupported languages give `null`. */
export function matchLocale(language: string | null | undefined): Locale | null {
  const base = language?.toLowerCase().split("-")[0]
  return isLocale(base) ? base : null
}
