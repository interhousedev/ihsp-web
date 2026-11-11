"use client"

import { LOCALES, LOCALE_NAMES, setLocale, useLocale, useT, type Locale } from "@ihsp/i18n"
import { FLAGS } from "./flags"

/** The shared Uzbek name is Latin of the old alphabet; the landing page names it in the new one. */
const NAMES: Record<Locale, string> = { ...LOCALE_NAMES, uz: "Özbekça" }

/** Three plain buttons with a flag (no dropdown script): the choice is stored like in the other apps (`ihsp.locale`). */
export function LocaleSwitch() {
  const t = useT("landing.footer")
  const current = useLocale()
  return (
    <div role="group" aria-label={t("language")} className="flex items-center">
      {LOCALES.map((locale) => {
        const Flag = FLAGS[locale]
        return (
          <button
            key={locale}
            type="button"
            lang={locale}
            aria-pressed={locale === current}
            aria-label={NAMES[locale]}
            title={NAMES[locale]}
            onClick={() => setLocale(locale)}
            className="hover:bg-muted inline-flex size-11 items-center justify-center gap-2 rounded-full text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[var(--brand)] aria-pressed:bg-[var(--brand-soft)] aria-pressed:text-[var(--brand-text)] lg:w-auto lg:px-3"
          >
            <Flag className="h-4 w-6 shrink-0 rounded-[3px] shadow-[0_0_0_1px_rgb(0_0_0/0.15)]" />
            <span className="hidden lg:inline">{NAMES[locale]}</span>
          </button>
        )
      })}
    </div>
  )
}
