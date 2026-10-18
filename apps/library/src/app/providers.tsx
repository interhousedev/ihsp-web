"use client"

import { ErrorTrackingInit } from "@ihsp/features-core/telemetry"
import { AuthProvider } from "@ihsp/auth"
import { ConfigGate } from "@ihsp/config"
import { ThemePreferenceSync, loadLibraryMessages } from "@ihsp/features-core"
import { PwaRuntime } from "@ihsp/features-core/pwa"
import { I18nProvider, mergeMessages, type Locale, type Messages } from "@ihsp/i18n"
import { AppThemeProvider, createQueryClient } from "@ihsp/ui"
import { QueryClientProvider } from "@tanstack/react-query"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { useState, type ReactNode } from "react"

/**
 * The app's own messages plus the `library` namespace of `@ihsp/features-core`. The path of the first import is
 * literal, so the bundler includes exactly the three message files of this app.
 */
async function loadAppMessages(locale: Locale): Promise<Messages> {
  const [app, library] = await Promise.all([import(`../../messages/${locale}.json`), loadLibraryMessages(locale)])
  return mergeMessages(app.default as Messages, library)
}

/**
 * ConfigGate (runtime config) → TanStack Query → i18n → nuqs → theme → auth. The library is public: nothing here starts
 * a login; pages that need one wrap themselves in `RequireAuth` through `LibraryShell`.
 * ConfigGate renders nothing while prerendering, so the static export never evaluates the URL-reading providers.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient)
  return (
    <ConfigGate>
      <ErrorTrackingInit />
      <QueryClientProvider client={queryClient}>
        <I18nProvider app="library" loadMessages={loadAppMessages}>
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
