"use client"

import { AuthProvider, TelegramAutoLogin } from "@ihsp/auth"
import { ConfigGate } from "@ihsp/config"
import { ThemePreferenceSync } from "@ihsp/features-core"
import { I18nProvider, mergeMessages, type Locale, type Messages } from "@ihsp/i18n"
import { TelegramBridge } from "@ihsp/telegram"
import { AppThemeProvider, createQueryClient } from "@ihsp/ui"
import { PinGate } from "@/features/pwa/components/pin-gate"
import { PwaGate } from "@/features/pwa/components/pwa-gate"
import { PwaRuntime } from "@/features/pwa/components/pwa-runtime"
import { QueryClientProvider } from "@tanstack/react-query"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { useState, type ReactNode } from "react"

/**
 * The import paths are literal, so the bundler includes exactly the message files of this app:
 * `messages/<locale>.json` plus `messages/<locale>/tools.json` (study tools, written separately by W3) and
 * `messages/<locale>/notebooks.json` (notebooks, Studio and the Gemini-style assistant) and
 * `messages/<locale>/pwa.json` (the installable app: install page, update toast, menu entry).
 */
async function loadAppMessages(locale: Locale): Promise<Messages> {
  const [base, tools, notebooks, pwa] = await Promise.all([
    import(`../../messages/${locale}.json`),
    import(`../../messages/${locale}/tools.json`),
    import(`../../messages/${locale}/notebooks.json`),
    import(`../../messages/${locale}/pwa.json`),
  ])
  return mergeMessages(
    mergeMessages(mergeMessages(base.default as Messages, tools.default as Messages), notebooks.default as Messages),
    pwa.default as Messages,
  )
}

/**
 * ConfigGate (runtime config) → TanStack Query → i18n → nuqs → theme → Telegram bridge → install page (pwa mode only) →
 * auth → Telegram auto login. ConfigGate renders nothing while prerendering, so the static export never evaluates the
 * URL-reading providers. `PwaGate` and `PwaRuntime` do nothing unless `APP_MODE` is `pwa` (the app host).
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
                <PwaGate>
                  <AuthProvider>
                    <PwaRuntime />
                    <ThemePreferenceSync>
                      <TelegramAutoLogin>
                        <PinGate>{children}</PinGate>
                      </TelegramAutoLogin>
                    </ThemePreferenceSync>
                  </AuthProvider>
                </PwaGate>
              </TelegramBridge>
            </AppThemeProvider>
          </NuqsAdapter>
        </I18nProvider>
      </QueryClientProvider>
    </ConfigGate>
  )
}
