"use client"

import { ErrorTrackingInit } from "@ihsp/features-core/telemetry"
import { AuthProvider } from "@ihsp/auth"
import { ConfigGate } from "@ihsp/config"
import { LazyTelegramBridge, ThemePreferenceSync } from "@ihsp/features-core"
import { I18nProvider, type Locale, type Messages } from "@ihsp/i18n"
import { AppThemeProvider, MotionProvider, createQueryClient } from "@ihsp/ui"
import { QueryClientProvider } from "@tanstack/react-query"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { useState, type ReactNode } from "react"

/** The path is literal, so the bundler includes exactly the three message files of this app. */
async function loadAppMessages(locale: Locale): Promise<Messages> {
  const app = await import(`../../messages/${locale}.json`)
  return app.default as Messages
}

/** ConfigGate → TanStack Query → i18n → nuqs → theme → auth; animations follow the reduced-motion preference. */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient)
  return (
    <ConfigGate>
      <ErrorTrackingInit />
      <QueryClientProvider client={queryClient}>
        <I18nProvider app="admission" loadMessages={loadAppMessages}>
          <NuqsAdapter>
            <AppThemeProvider>
              <AuthProvider>
                <LazyTelegramBridge>
                  <ThemePreferenceSync>
                    <MotionProvider>{children}</MotionProvider>
                  </ThemePreferenceSync>
                </LazyTelegramBridge>
              </AuthProvider>
            </AppThemeProvider>
          </NuqsAdapter>
        </I18nProvider>
      </QueryClientProvider>
    </ConfigGate>
  )
}
