import { create } from "zustand"
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, isLocale, matchLocale, type Locale } from "./locales"

type LocaleState = {
  locale: Locale
  /** True once the stored or browser locale was read (false while prerendering and before hydration). */
  resolved: boolean
  /** Reads `localStorage`, then the browser language; the account preference (if any) is applied afterwards. */
  resolve: () => void
  /** An explicit choice (language switcher): stored in `localStorage` and applied at once. */
  setLocale: (locale: Locale) => void
  /** The account preference (`UserMe.preferences.locale`) wins over the stored and the browser locale. */
  setPreferredLocale: (locale: Locale | null | undefined) => void
}

function readStoredLocale(): Locale | null {
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY)
    return isLocale(stored) ? stored : null
  } catch {
    return null
  }
}

function writeStoredLocale(locale: Locale): void {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // Storage can be blocked (private mode); the choice then lasts until the page closes.
  }
}

function browserLocale(): Locale | null {
  const languages = typeof navigator === "undefined" ? [] : [...(navigator.languages ?? []), navigator.language]
  for (const language of languages) {
    const match = matchLocale(language)
    if (match) return match
  }
  return null
}

export const useLocaleStore = create<LocaleState>()((set, get) => ({
  locale: DEFAULT_LOCALE,
  resolved: false,
  resolve: () => {
    if (get().resolved) return
    set({ locale: readStoredLocale() ?? browserLocale() ?? DEFAULT_LOCALE, resolved: true })
  },
  setLocale: (locale) => {
    writeStoredLocale(locale)
    set({ locale, resolved: true })
  },
  setPreferredLocale: (locale) => {
    if (!isLocale(locale)) return
    set({ locale, resolved: true })
  },
}))

/** The locale in effect right now, for code outside React (formatters, tests). */
export function currentLocale(): Locale {
  return useLocaleStore.getState().locale
}

export function setLocale(locale: Locale): void {
  useLocaleStore.getState().setLocale(locale)
}

export function setPreferredLocale(locale: Locale | null | undefined): void {
  useLocaleStore.getState().setPreferredLocale(locale)
}
