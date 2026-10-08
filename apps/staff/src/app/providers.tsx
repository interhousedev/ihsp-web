"use client"

import { AuthProvider, TelegramAutoLogin } from "@ihsp/auth"
import { ConfigGate } from "@ihsp/config"
import { ThemePreferenceSync } from "@ihsp/features-core"
import { I18nProvider, type Locale, type Messages } from "@ihsp/i18n"
import { TelegramBridge } from "@ihsp/telegram"
import { AppThemeProvider, createQueryClient } from "@ihsp/ui"
import { QueryClientProvider } from "@tanstack/react-query"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { useState, type ReactNode } from "react"

/** The path of the import is literal, so the bundler includes exactly the three message files of this app. */
async function loadAppMessages(locale: Locale): Promise<Messages> {
  const messages = await import(`../../messages/${locale}.json`)
  return messages.default as Messages
}

/**
 * ConfigGate (runtime config) → TanStack Query → i18n → nuqs → theme → auth → Telegram bridge → Telegram auto login.
 * ConfigGate renders nothing while prerendering, so the static export never evaluates the URL-reading providers.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient)
  return (
    <ConfigGate>
      <QueryClientProvider client={queryClient}>
        <I18nProvider app="staff" loadMessages={loadAppMessages}>
          <NuqsAdapter>
            <AppThemeProvider>
              <TelegramBridge>
                <AuthProvider>
                  <ThemePreferenceSync>
                    <TelegramAutoLogin>{children}</TelegramAutoLogin>
                  </ThemePreferenceSync>
                </AuthProvider>
              </TelegramBridge>
            </AppThemeProvider>
          </NuqsAdapter>
        </I18nProvider>
      </QueryClientProvider>
    </ConfigGate>
  )
}
