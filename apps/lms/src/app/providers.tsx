"use client"

import { ErrorTrackingInit } from "@ihsp/features-core/telemetry"
import { AuthProvider } from "@ihsp/auth"
import { ConfigGate } from "@ihsp/config"
import { ThemePreferenceSync } from "@ihsp/features-core"
import { PwaRuntime } from "@ihsp/features-core/pwa"
import { I18nProvider, mergeMessages, type Locale, type Messages } from "@ihsp/i18n"
import { AppThemeProvider, createQueryClient } from "@ihsp/ui"
import { QueryClientProvider } from "@tanstack/react-query"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { useState, type ReactNode } from "react"

/** The path of the import is literal, so the bundler includes exactly the two message files of this app. */
async function loadAppMessages(locale: Locale): Promise<Messages> {
  // The workspace of a course reuses the notebooks screens of `@ihsp/features-core`; their texts live next to the
  // student app's (`apps/sp/messages/<locale>/notebooks*.json`).
  const [app, notebooks] = await Promise.all([
    import(`../../messages/${locale}.json`),
    import(`../../../sp/messages/${locale}/notebooks.json`),
  ])
  return mergeMessages(app.default as Messages, notebooks.default as Messages)
}

/**
 * ConfigGate (runtime config) → TanStack Query → i18n → nuqs → theme → auth → PWA runtime (pwa mode only).
 * ConfigGate renders nothing while prerendering, so the static export never evaluates the URL-reading providers.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient)
  return (
    <ConfigGate>
      <ErrorTrackingInit />
      <QueryClientProvider client={queryClient}>
        <I18nProvider app="lms" loadMessages={loadAppMessages}>
          <NuqsAdapter>
            <AppThemeProvider>
              <AuthProvider>
                <PwaRuntime />
                <ThemePreferenceSync>{children}</ThemePreferenceSync>
              </AuthProvider>
            </AppThemeProvider>
          </NuqsAdapter>
        </I18nProvider>
      </QueryClientProvider>
    </ConfigGate>
  )
}
