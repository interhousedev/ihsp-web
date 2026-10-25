import { NextIntlClientProvider } from "next-intl"
import type { ReactNode } from "react"
import { TIME_ZONE, type Locale } from "./locales"
import type { Messages } from "./messages"

/** Synchronous provider for tests and stories: no dynamic import, no locale store. */
export function I18nTestProvider({
  locale = "en",
  messages,
  children,
}: {
  locale?: Locale
  messages: Messages
  children: ReactNode
}) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone={TIME_ZONE}
      getMessageFallback={({ namespace, key }) => (namespace ? `${namespace}.${key}` : key)}
      onError={() => undefined}
    >
      {children}
    </NextIntlClientProvider>
  )
}
