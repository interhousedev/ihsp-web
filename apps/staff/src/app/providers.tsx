"use client"

import { ErrorTrackingInit } from "@ihsp/features-core/telemetry"
import { AuthProvider, TelegramAutoLogin } from "@ihsp/auth"
import { ConfigGate } from "@ihsp/config"
import { ThemePreferenceSync } from "@ihsp/features-core"
import { PwaRuntime } from "@ihsp/features-core/pwa"
import { PinGate } from "@ihsp/features-core/pwa/lock"
import { I18nProvider, mergeMessages, type Locale, type Messages } from "@ihsp/i18n"
import { AppThemeProvider, createQueryClient } from "@ihsp/ui"
import { QueryClientProvider } from "@tanstack/react-query"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { useEffect, useState, type ComponentType, type ReactNode } from "react"

type Bridge = ComponentType<{ children: ReactNode }>

/** True when Telegram launched the page: the same signs as `TELEGRAM_SDK_LOADER` in `layout.tsx`, without the SDK. */
function launchedByTelegram(): boolean {
  if (typeof window === "undefined") return false
  try {
    if (/tgWebApp/.test(window.location.hash) || "TelegramWebviewProxy" in window) return true
    return !!(sessionStorage.getItem("tapps/launchParams") || sessionStorage.getItem("__telegram__initParams"))
  } catch {
    return false
  }
}

/**
 * The mini-app bridge (theme, safe areas, SDK init) is imported only inside Telegram, so a browser visit never
 * downloads that chunk; until it arrives, and everywhere else, the children render unchanged.
 */
function TelegramBridge({ children }: { children: ReactNode }) {
  const [Loaded, setLoaded] = useState<Bridge | null>(null)
  useEffect(() => {
    if (!launchedByTelegram()) return
    let cancelled = false
    import("@ihsp/telegram")
      .then((telegram) => {
        if (!cancelled) setLoaded(() => telegram.TelegramBridge)
      })
      .catch((error: unknown) => console.error("[telegram] bridge failed to load", error))
    return () => {
      cancelled = true
    }
  }, [])
  return Loaded ? <Loaded>{children}</Loaded> : <>{children}</>
}

/**
 * The path of the import is literal, so the bundler includes exactly the message files of this app: its own
 * `messages/<locale>.json` and the notebook strings (notebooks, Studio, errors) that the student app owns and the
 * shared `features-core` notebooks need; one source, so the two apps cannot drift apart.
 */
async function loadAppMessages(locale: Locale): Promise<Messages> {
  const [base, notebooks] = await Promise.all([
    import(`../../messages/${locale}.json`),
    import(`../../../sp/messages/${locale}/notebooks.json`),
  ])
  return mergeMessages(base.default as Messages, notebooks.default as Messages)
}

/**
 * ConfigGate (runtime config) → TanStack Query → i18n → nuqs → theme → auth → Telegram bridge → Telegram auto login.
 * ConfigGate renders nothing while prerendering, so the static export never evaluates the URL-reading providers.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient)
  return (
    <ConfigGate>
      <ErrorTrackingInit />
      <QueryClientProvider client={queryClient}>
        <I18nProvider app="staff" loadMessages={loadAppMessages}>
          <NuqsAdapter>
            <AppThemeProvider>
              <TelegramBridge>
                <AuthProvider>
                  <PwaRuntime />
                  <ThemePreferenceSync>
                    <PinGate>
                      <TelegramAutoLogin>{children}</TelegramAutoLogin>
                    </PinGate>
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
