"use client"

import { ConfigGate } from "@ihsp/config"
import { I18nProvider, type Locale, type Messages } from "@ihsp/i18n"
import { AppThemeProvider, createQueryClient } from "@ihsp/ui"
import { QueryClientProvider } from "@tanstack/react-query"
import { useState, type ReactNode } from "react"

/** The path of the import is literal, so the bundler includes exactly the three message files of this app. */
async function loadAppMessages(locale: Locale): Promise<Messages> {
  const messages = await import(`../../messages/${locale}.json`)
  return messages.default as Messages
}

/** ConfigGate (runtime config) → TanStack Query → i18n → theme. Visitors are anonymous: no auth, no Telegram. */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient)
  return (
    <ConfigGate>
      <QueryClientProvider client={queryClient}>
        <I18nProvider app="share" loadMessages={loadAppMessages}>
          <AppThemeProvider>{children}</AppThemeProvider>
        </I18nProvider>
      </QueryClientProvider>
    </ConfigGate>
  )
}
