"use client"

import { ErrorTrackingInit } from "@ihsp/features-core/telemetry"
import { ConfigGate } from "@ihsp/config"
import { I18nProvider, mergeMessages, type Locale, type Messages } from "@ihsp/i18n"
import { AppThemeProvider, createQueryClient } from "@ihsp/ui"
import { QueryClientProvider } from "@tanstack/react-query"
import { useState, type ReactNode } from "react"

/** The path of the import is literal, so the bundler includes exactly the message files of this app. */
async function loadAppMessages(locale: Locale): Promise<Messages> {
  // A shared Studio output is drawn by the notebook viewers of `@ihsp/features-core`; their texts live next to the
  // student app's (`apps/sp/messages/<locale>/notebooks.json`).
  const [app, notebooks] = await Promise.all([
    import(`../../messages/${locale}.json`),
    import(`../../../sp/messages/${locale}/notebooks.json`),
  ])
  return mergeMessages(app.default as Messages, notebooks.default as Messages)
}

/** ConfigGate (runtime config) → TanStack Query → i18n → theme. Visitors are anonymous: no auth, no Telegram. */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient)
  return (
    <ConfigGate>
      <ErrorTrackingInit />
      <QueryClientProvider client={queryClient}>
        <I18nProvider app="share" loadMessages={loadAppMessages}>
          <AppThemeProvider>{children}</AppThemeProvider>
        </I18nProvider>
      </QueryClientProvider>
    </ConfigGate>
  )
}
