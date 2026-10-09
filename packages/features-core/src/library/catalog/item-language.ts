const KNOWN = new Set(["uz_latn", "uz_cyrl", "ru", "en", "qq", "other"])

/** The display name of an item language code (`uz_latn` …); unknown codes are shown as they are. */
export function itemLanguageLabel(code: string, t: (key: string) => string): string {
  return KNOWN.has(code) ? t(`browse.language.${code}`) : code
}
