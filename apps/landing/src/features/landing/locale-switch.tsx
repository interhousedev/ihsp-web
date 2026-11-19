"use client"

import { LOCALES, LOCALE_NAMES, setLocale, useLocale, useT, type Locale } from "@ihsp/i18n"
import { FLAGS } from "./flags"

/** The shared Uzbek name names it in the old alphabet; the landing page uses the current Latin alphabet. */
const NAMES: Record<Locale, string> = { ...LOCALE_NAMES, uz: "Oʻzbekcha" }

/** Three plain buttons with a flag, and the language name when `showNames` is set (no dropdown script): the choice is stored like in the other apps (`ihsp.locale`). */
export function LocaleSwitch({ showNames = false }: { showNames?: boolean }) {
  const t = useT("landing.footer")
  const current = useLocale()
  return (
    <div role="group" aria-label={t("language")} className="lnd-lang">
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
            className="lnd-lang-btn"
          >
            <Flag className="h-4 w-6 shrink-0 rounded-[3px] shadow-[0_0_0_1px_rgb(0_0_0/0.15)]" />
            {showNames ? <span>{NAMES[locale]}</span> : null}
          </button>
        )
      })}
    </div>
  )
}
