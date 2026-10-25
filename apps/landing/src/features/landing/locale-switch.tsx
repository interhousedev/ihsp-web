"use client"

import { LOCALES, LOCALE_NAMES, setLocale, useLocale, useT } from "@ihsp/i18n"

/** Three plain buttons (no dropdown script): the choice is stored like in the other apps (`ihsp.locale`). */
export function LocaleSwitch() {
  const t = useT("landing.footer")
  const current = useLocale()
  return (
    <div role="group" aria-label={t("language")} className="flex flex-wrap gap-1">
      {LOCALES.map((locale) => (
        <button
          key={locale}
          type="button"
          lang={locale}
          aria-pressed={locale === current}
          onClick={() => setLocale(locale)}
          className="min-h-11 rounded-full px-3 text-sm font-medium transition-colors hover:bg-muted aria-pressed:bg-[var(--brand)] aria-pressed:text-[var(--brand-ink)]"
        >
          {LOCALE_NAMES[locale]}
        </button>
      ))}
    </div>
  )
}
