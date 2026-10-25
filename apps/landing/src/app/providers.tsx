"use client"

import { DEFAULT_LOCALE, TIME_ZONE, mergeMessages, useLocaleStore, type Locale, type Messages } from "@ihsp/i18n"
import sharedEn from "@ihsp/i18n/messages/en.json"
import sharedRu from "@ihsp/i18n/messages/ru.json"
import sharedUz from "@ihsp/i18n/messages/uz.json"
import { NextIntlClientProvider } from "next-intl"
import { useEffect, type ReactNode } from "react"
import en from "../../messages/en.json"
import ru from "../../messages/ru.json"
import uz from "../../messages/uz.json"

/**
 * All three locales are bundled (the texts are small), so the static HTML is fully rendered in the default locale and
 * a language switch needs no request. No ConfigGate: the page renders without `/env.js`; links read it after mount.
 */
export const LANDING_MESSAGES: Record<Locale, Messages> = {
  uz: mergeMessages(sharedUz as Messages, uz as Messages),
  ru: mergeMessages(sharedRu as Messages, ru as Messages),
  en: mergeMessages(sharedEn as Messages, en as Messages),
}

export function Providers({ children }: { children: ReactNode }) {
  const locale = useLocaleStore((state) => state.locale)
  const resolved = useLocaleStore((state) => state.resolved)
  useEffect(() => {
    useLocaleStore.getState().resolve()
  }, [])
  useEffect(() => {
    if (resolved) document.documentElement.lang = locale
  }, [locale, resolved])
  const active = resolved ? locale : DEFAULT_LOCALE
  return (
    <NextIntlClientProvider
      locale={active}
      messages={LANDING_MESSAGES[active]}
      timeZone={TIME_ZONE}
      onError={() => undefined}
      getMessageFallback={({ namespace, key }) => (namespace ? `${namespace}.${key}` : key)}
    >
      {children}
    </NextIntlClientProvider>
  )
}
