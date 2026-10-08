"use client"

import { AuthProvider, TelegramAutoLogin } from "@ihsp/auth"
import { ConfigGate } from "@ihsp/config"
import { I18nProvider, mergeMessages, type Locale, type Messages } from "@ihsp/i18n"
import { TelegramBridge } from "@ihsp/telegram"
import { AppThemeProvider, createQueryClient } from "@ihsp/ui"
import { QueryClientProvider } from "@tanstack/react-query"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { useState, type ReactNode } from "react"

/**
 * The import paths are literal, so the bundler includes exactly the message files of this app:
 * `messages/<locale>.json` plus `messages/<locale>/tools.json` (study tools, written separately by W3).
 */
async function loadAppMessages(locale: Locale): Promise<Messages> {
  const [base, tools] = await Promise.all([
    import(`../../messages/${locale}.json`),
    import(`../../messages/${locale}/tools.json`),
  ])
  return mergeMessages(base.default as Messages, tools.default as Messages)
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
        <I18nProvider app="sp" loadMessages={loadAppMessages}>
          <NuqsAdapter>
            <AppThemeProvider>
              <TelegramBridge>
                <AuthProvider>
                  <TelegramAutoLogin>{children}</TelegramAutoLogin>
                </AuthProvider>
              </TelegramBridge>
            </AppThemeProvider>
          </NuqsAdapter>
        </I18nProvider>
      </QueryClientProvider>
    </ConfigGate>
  )
}
